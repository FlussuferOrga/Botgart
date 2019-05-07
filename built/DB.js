"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util = __importStar(require("./Util.js"));
const sqlite3 = __importStar(require("better-sqlite3"));
// FIXME: resolve objects when loading from db
class Database {
    constructor(file, client) {
        this.file = file;
        this.client = client;
    }
    execute(f) {
        let db = sqlite3.default(this.file, undefined);
        db.pragma("foreign_keys = ON");
        let res;
        try {
            res = f(db);
        }
        catch (err) {
            res = undefined;
            Util.log("error", "DB.js", "DB execute: {0}".formatUnicorn(err["message"]));
        }
        db.close();
        return res;
    }
    // NOTE: https://github.com/orlandov/node-sqlite/issues/17
    // sqlite3 and node don't work well together in terms of large integers.
    // Therefore, all big numbers are stored as strings.
    // As a consequence, === can't be used, when checking them.
    initSchema() {
        let sqls = [
            `CREATE TABLE IF NOT EXISTS registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            api_key TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            registration_role TEXT,
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(user, guild) ON CONFLICT REPLACE,
            UNIQUE(guild, api_key)
        )`,
            `CREATE TABLE IF NOT EXISTS cronjobs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule TEXT NOT NULL,
            command TEXT NOT NULL,
            arguments TEXT,
            created_by TEXT NOT NULL,
            guild TEXT NOT NULL,
            created TIMESTAMP DEFAULT (datetime('now','localtime'))
        )`,
            `CREATE TABLE IF NOT EXISTS faqs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT,
            created_by TEXT NOT NULL,
            guild TEXT NOT NULL,
            created TIMESTAMP DEFAULT (datetime('now','localtime'))
        )`,
            `CREATE TABLE IF NOT EXISTS faq_keys(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL,
            faq_id INTEGER,
            created_by TEXT NOT NULL,
            guild TEXT NOT NULL,
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(key) ON CONFLICT REPLACE,
            FOREIGN KEY(faq_id) REFERENCES faqs(id) 
                ON UPDATE CASCADE
                ON DELETE CASCADE
        )`,
            `CREATE TABLE IF NOT EXISTS tap_reminder(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            objective TEXT NOT NULL,
            objective_id INTEGER,
            created TIMESTAMP DEFAULT (datetime('now','localtime'))
        )`,
            `CREATE INDEX IF NOT EXISTS index_faq_keys_key ON faq_keys(key)`
        ];
        sqls.forEach(sql => this.execute(db => db.prepare(sql).run()));
    }
    patchWorldCol() {
        let sql = `ALTER TABLE registrations ADD COLUMN registration_role TEXT`;
    }
    storeFAQ(user, guild, keys, text) {
        return this.execute(db => {
            let last_id = undefined;
            db.transaction((_) => {
                db.prepare(`INSERT INTO faqs(created_by, guild, text) VALUES(?,?,?)`).run(user, guild, text);
                last_id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
                let stmt = db.prepare(`INSERT INTO faq_keys(created_by, guild, key, faq_id) VALUES(?,?,?,?)`);
                keys.forEach(k => stmt.run(user, guild, k, last_id));
            })(null);
            return last_id;
        });
    }
    deleteFAQ(key, guild) {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM faq_keys WHERE key = ? AND guild = ?`).run(key, guild);
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
                db.prepare(`DELETE FROM faqs WHERE id IN (SELECT f.id FROM faqs AS f LEFT JOIN faq_keys AS fk ON f.id = fk.faq_id WHERE key IS NULL)`).run();
            })(null);
            return changes > 0;
        });
    }
    getFAQ(key, guild) {
        return this.execute(db => db.prepare(`SELECT * FROM faqs AS f JOIN faq_keys AS fk ON f.id = fk.faq_id WHERE fk.key = ? AND fk.guild = ?`).get(key, guild));
    }
    getFAQs(guild) {
        return this.execute(db => db.prepare(`SELECT * FROM faqs AS f JOIN faq_keys AS fk ON f.id = fk.faq_id WHERE fk.guild = ?`).all(guild));
    }
    storeAPIKey(user, guild, key, gw2account, role) {
        let sql = `INSERT INTO registrations(user, guild, api_key, gw2account, registration_role) VALUES(?,?,?,?,?)`;
        return this.execute(db => {
            try {
                db.prepare(sql).run(user, guild, key, gw2account);
                return true;
            }
            catch (err) {
                return false;
            }
        });
    }
    /**
    * @returns {[({api_key, guild, user, registration_role}, admittedRole|null)]} - a list of tuples, where each tuple holds a user row from the db
    *           and the name of the role that user should have
    */
    revalidateKeys() {
        return this.execute(db => 
        // FIXME: writeback into the db, make sure people who were removed once don't get notified all the time through revalidations
        Promise.all(db.prepare(`SELECT api_key, guild, user, registration_role FROM registrations ORDER BY guild`).all()
            .map(r => Util.validateWorld(r.api_key).then(admittedRole => [r, admittedRole]))));
    }
    deleteKey(key) {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM registrations WHERE api_key = ?`).run(key);
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null);
            return changes > 0;
        });
    }
    dummy() {
        return; // not testing rn
        let sql = `INSERT INTO registrations(user, api_key, gw2account) VALUES
        (?,?,?),
        (?,?,?)
        `;
        this.execute(db => db.prepare(sql).run([
            100, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-B88DD2202076', "asd",
            230947151931375617, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-000000000000', "dsa"
        ]));
    }
    storeCronjob(schedule, command, args, creator, guild) {
        let sql = `INSERT INTO cronjobs(schedule, command, arguments, created_by, guild) VALUES (?,?,?,?,?)`;
        return this.execute(db => {
            let last_id = undefined;
            db.transaction((_) => {
                db.prepare(sql).run(schedule, command, args, creator, guild);
                last_id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
            })(null);
            return last_id;
        });
    }
    getCronjobs() {
        return this.execute(db => db.prepare(`SELECT * FROM cronjobs`).all());
    }
    deleteCronjob(id) {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM cronjobs WHERE id = ?`).run(id);
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null);
            return changes > 0;
        });
    }
    findDuplicateRegistrations() {
        return this.execute(db => db.prepare(`SELECT group_concat(user, ',') AS users, COUNT(*) AS count, gw2account FROM registrations GROUP BY gw2account HAVING count > 1`).all());
    }
    storeTapReminder(objective, objective_id) {
        let sql = `INSERT INTO tap_reminder(objective) VALUES (?);`;
        return this.execute(db => {
            let last_id = undefined;
            db.transaction((_) => {
                db.prepare(sql).run(objective);
                last_id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
            })(null);
            return last_id;
        });
    }
    getTapReminder() {
        return this.execute(db => db.prepare(`SELECT * FROM tap_reminder;`).all());
    }
}
exports.Database = Database;
