const Util = require("./Util.js");
const winston = require('winston');
const sqlite3 = require("better-sqlite3");

function execute(f) {
    let db = new sqlite3("./db/database.db", [], err => {
        if(err) {
            return winston.log("error", "DB open()", err);
        }
    });

    try {
        var res = f(db);
    } catch(err) {
        var res = undefined;
        console.log(err);
        winston.log("error", "DB execute", err);
    }

    db.close(err => {
        if(err) {
            return winston.log("error", "DB close()", err);
        }
    });
    return res;
}

exports.initSchema = function() {
    let sqls = [
    `CREATE TABLE IF NOT EXISTS registrations(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user BIGINT NOT NULL,
        guild BIGINT NOT NULL,
        api_key TEXT NOT NULL,
        gw2account TEXT NOT NULL,
        created TIMESTAMP DEFAULT (datetime('now','localtime')),
        UNIQUE(user, guild) ON CONFLICT REPLACE,
        UNIQUE(guild, api_key)
    )`, // no ON CONFLICT for second unique, that's an actual error
    `CREATE TABLE IF NOT EXISTS cronjobs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule TEXT NOT NULL,
        command TEXT NOT NULL,
        arguments TEXT,
        created_by BIGINT NOT NULL,
        guild BIGINT NOT NULL,
        created TIMESTAMP DEFAULT (datetime('now','localtime'))
    )`
    ]; 
    sqls.forEach(sql => execute(db => db.prepare(sql).run()))
    
}

exports.storeAPIKey = function(user, guild, key, gw2account) {
    let sql = `INSERT INTO registrations(user, guild, api_key, gw2account) VALUES(?,?,?,?)`;
    return execute(db => {
                try {
                    db.prepare(sql).run(user, guild, key, gw2account);
                    return true;
                } catch(err) {
                    //console.error(err);
                    return false;
                }
            });
}

exports.revalidateKeys = function() {
    return execute(db => 
        Promise.all(
            db.prepare(`SELECT api_key, guild, user FROM registrations ORDER BY guild`).all().map(r => 
                Util.validateWorld(r.api_key).then(isOnWorld => !isOnWorld ? r : undefined)
            )
        )
    );
}

exports.deleteKey = function(key) {
    execute(db => db.prepare(`DELETE FROM registrations WHERE api_key = ?`).run(key));
}


exports.dummy = function() {
    let sql = `INSERT INTO registrations(user, api_key, gw2account) VALUES
    (?,?,?),
    (?,?,?)
    `;
    execute(db => db.prepare(sql).run([
        100, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-B88DD2202076',"asd", 
        230947151931375617, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-000000000000',"dsa"
        ]));

}

exports.storeCronjob = function(schedule, command, args, creator, guild) {
    let sql = `INSERT INTO cronjobs(schedule, command, arguments, created_by, guild) VALUES (?,?,?,?,?)`;
    return execute(db => {
        let last_id = undefined;
        db.transaction((_) => {
            db.prepare(sql).run(schedule, command, args, creator, guild);
            last_id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
        })(null);
        return last_id;
    });
}

exports.getCronjobs = function() {
    return execute(db => db.prepare(`SELECT * FROM cronjobs`).all());
}

exports.deleteCronjob = function(id) {
    return execute(db => {
        let changes = 0;
        db.transaction((_) => {
            db.prepare(`DELETE FROM cronjobs WHERE id = ?`).run(id)
            changes = db.prepare(`SELECT changes() AS changes`).get().changes;
        })(null);
        return changes > 0;
    });
}