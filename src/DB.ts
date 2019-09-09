import * as Util from "./Util.js";
import * as sqlite3 from "better-sqlite3";
import * as discord from "discord.js";
import { BotgartClient } from "./BotgartClient";
import { PermissionTypes } from "./BotgartCommand";
import * as ResetLead from "./commands/resetlead/ResetRoster";
import Timeout from "await-timeout";
import {Semaphore} from "await-semaphore";

const REAUTH_DELAY : number = 5000;
const REAUTH_MAX_PARALLEL_REQUESTS : number = 3;

// FIXME: resolve objects when loading from db


export class Database {
    readonly file: string;
    private client: BotgartClient;

    constructor(file: string, client: BotgartClient) {
        this.file = file;
        this.client = client;
    }

    execute<T>(f: (sqlite3) => T): T|undefined  {
        let db: sqlite3.Database = sqlite3.default(this.file, undefined);
        db.pragma("foreign_keys = ON");

        let res: T|undefined;
        try {
            res = f(db);
        } catch(err) {
            res = undefined;
            Util.log("error", "DB.js", "DB execute: {0}".formatUnicorn(err["message"]));
        }

        db.close();
        return res;
    }

    async executeAsync<T>(f: (sqlite) => T): Promise<T|undefined> {
        return this.execute(f);
    }

    public getUserByAccountName(accountName: string) {
        return this.execute(db => db.prepare(
                `SELECT id, user, guild, api_key, gw2account, registration_role, account_name, created 
                 FROM registrations 
                 WHERE account_name = ? 
                 ORDER BY created DESC`
            ).get(accountName));
    }

    // NOTE: https://github.com/orlandov/node-sqlite/issues/17
    // sqlite3 and node don't work well together in terms of large integers.
    // Therefore, all big numbers are stored as strings.
    // As a consequence, === can't be used, when checking them.
    initSchema(): void {
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
        )`, // no ON CONFLICT for second unique, that's an actual error
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
        `CREATE INDEX IF NOT EXISTS index_faq_keys_key ON faq_keys(key)`
        ]; 
        sqls.forEach(sql => this.execute(db => db.prepare(sql).run()));
    }

    upsertRosterPost(guild: discord.Guild, roster: ResetLead.Roster, message: discord.Message) {
        return this.execute(db => {
            db.transaction((_) => {
                const current = db.prepare(`SELECT reset_roster_id AS rrid FROM reset_rosters WHERE guild = ? AND week_number = ?`).get(guild.id, roster.weekNumber);
                let rosterId = current ? current.rrid : undefined;
                if(rosterId === undefined) {
                    // completely new roster -> create new roster and store ID
                    db.prepare(`INSERT INTO reset_rosters(week_number, guild, channel, message) VALUES(?,?,?,?)`)
                      .run(roster.weekNumber, guild.id, message.channel.id, message.id);
                    rosterId = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;    
                } else {
                    // there is already a roster entry -> drop all leaders and insert the current state
                    db.prepare(`DELETE FROM reset_leaders WHERE reset_roster_id = ?`).run(rosterId);
                }                
                let stmt = db.prepare(`INSERT INTO reset_leaders(reset_roster_id, player, map) VALUES(?,?,?)`);
                roster.getLeaders().forEach(([map, leader]) => stmt.run(rosterId, leader, map));
            })(null);
        });
    }

    getActiveRosters(guild: discord.Guild): Promise<[undefined, undefined, undefined] | [ResetLead.Roster, discord.TextChannel, discord.Message]>[] {
        return this.execute(db => db.prepare(`SELECT rr.week_number AS wn FROM reset_rosters AS rr WHERE week_number >= ? AND guild = ?`)
                                    .all(Util.getNumberOfWeek(), guild.id)
                                    .map(row => this.getRosterPost(guild, row.wn)));
    }

    async getRosterPost(guild: discord.Guild, weekNumber: number) 
          : Promise<[undefined, undefined, undefined] | [ResetLead.Roster, discord.TextChannel, discord.Message]> {
        let postExists = false;
        const roster = new ResetLead.Roster(weekNumber);
        const entries = this.execute(db => db.prepare(`
            SELECT 
                rr.reset_roster_id,
                rr.week_number,
                rr.guild,
                rr.channel,
                rr.message,
                rl.player,
                rl.map
            FROM 
                reset_rosters AS rr 
                LEFT JOIN reset_leaders AS rl 
                  ON rr.reset_roster_id = rl.reset_roster_id
            WHERE 
                rr.guild = ?
                AND rr.week_number = ?`)
            .all(guild.id, weekNumber));
        entries.forEach(r => roster.addLead(ResetLead.WvWMap.getMapByName(r.map), r.player));

        let channel: discord.TextChannel;
        let message: discord.Message;
        if(entries.length > 0) {
            channel = await <discord.TextChannel>guild.channels.find(c => c.id === entries[0].channel);
            if(channel) {
                try {
                    message = await (<discord.TextChannel>channel).fetchMessage(entries[0].message);    
                    postExists = true;
                } catch(e) {
                    postExists = false;
                }
            }            
            if(!postExists) {
                // there was a roster in the DB to which there is no accessible roster-post left -> delete from db!
                this.execute(db => db.prepare(`DELETE FROM reset_leaders WHERE reset_roster_id = ?`).run(entries[0].reset_roster_id));
                this.execute(db => db.prepare(`DELETE FROM reset_rosters WHERE reset_roster_id = ?`).run(entries[0].reset_roster_id));
            }
        }
        
        return entries && postExists ? [roster, channel, message] : [undefined,undefined,undefined];
    }

    getLogChannels(guild: discord.Guild, type: string): string[] {
        return this.execute(db => db.prepare("SELECT channel FROM discord_log_channels WHERE guild = ? AND type = ?")
                                    .all(guild.id, type).map(c => c.channel));
    }

    addLogChannel(guild: discord.Guild, type: string, channel: discord.TextChannel): void {
        this.execute(db => db.prepare("INSERT INTO discord_log_channels(guild, type, channel) VALUES(?,?,?)").run(guild.id, type, channel.id));
    }

    removeLogChannel(guild: discord.Guild, type: string): void {
        this.execute(db => db.prepare("DELETE FROM discord_log_channels WHERE guild = ? AND type = ?").run(guild.id, type));
    }

    whois(searchString: string, discordCandidates: discord.User[]): {"discord_user": string, "account_name": string}[] {
        return this.execute(db => {
            db.prepare(`CREATE TEMP TABLE IF NOT EXISTS whois(discord_id TEXT)`).run();
            const stmt = db.prepare(`INSERT INTO whois(discord_id) VALUES(?)`);
            discordCandidates.forEach(dc => stmt.run(dc.id));
            return db.prepare(`
                SELECT
                    user         AS discord_user,
                    account_name AS account_name
                FROM 
                    registrations AS r 
                    JOIN whois AS w 
                      ON w.discord_id = r.user
                UNION 
                SELECT 
                    user         AS discord_user, 
                    account_name AS account_name
                FROM 
                    registrations 
                WHERE 
                    LOWER(account_name) LIKE ('%' || ? || '%')
            `).all(searchString.toLowerCase());
        });
    }

    checkPermission(command: string, uid: string, roles: string[], gid?: string): [boolean,number] {
        roles.push(uid);
        const params = '?,'.repeat(roles.length).slice(0, -1);
        let permission = this.execute(db => 
            db.prepare(`
                SELECT 
                  TOTAL(value) AS permission -- total() returns 0.0 for the sum of [null]
                FROM 
                  command_permissions
                WHERE
                  command = ?
                  AND guild = ?
                  AND receiver IN (${params})
                  AND type IN ('user','role') -- avoid messups with users named "everyone"
            `).get([command, gid].concat(roles)).permission);
        return [permission > 0, permission];
    }

    setPermission(command: string, receiver: string, type: PermissionTypes, value: number, gid?: string): number|undefined {
        return this.execute(db => {
            let perm = undefined;
            db.transaction((_) => {
                db.prepare(`INSERT INTO command_permissions(command, receiver, type, guild, value) 
                    VALUES(?,?,?,?,?)
                    ON CONFLICT(command, receiver) DO UPDATE SET
                      value = ?`).run(command, receiver, type, gid, value, value);
                perm = db.prepare(`
                         SELECT SUM(value) AS perm 
                         FROM command_permissions 
                         WHERE command = ? AND guild = ? AND receiver = ?`
                       ).get(command, gid, receiver).perm;
            })(null);
            return perm;
        });
    }


    getGW2Accounts(accnames: [string]): [object] {
        return this.execute(db => db.prepare(`SELECT id, user, guild, api_key, gw2account, registration_role, created WHERE gw2account IN (?)`)
                                    .run(accnames.join(",")).all());
    }

    getDesignatedRoles() {
        return this.execute(db => db.prepare(`SELECT user, guild, registration_role FROM registrations ORDER BY guild`).all());
    }

    storeFAQ(user: string, guild: string, keys: [string], text: string): number|undefined {
        return this.execute(db => {
            let lastId = undefined;
            db.transaction((_) => {
                db.prepare(`INSERT INTO faqs(created_by, guild, text) VALUES(?,?,?)`).run(user, guild, text);
                lastId = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
                let stmt = db.prepare(`INSERT INTO faq_keys(created_by, guild, key, faq_id) VALUES(?,?,?,?)`);
                keys.forEach(k => stmt.run(user, guild, k, lastId));
            })(null);
            return lastId;
        });
    }

    deleteFAQ(key: string, guild: string): boolean|undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM faq_keys WHERE key = ? AND guild = ?`).run(key, guild)
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
                db.prepare(`DELETE FROM faqs WHERE id IN (SELECT f.id FROM faqs AS f LEFT JOIN faq_keys AS fk ON f.id = fk.faq_id WHERE key IS NULL)`).run();
            })(null);
            return changes > 0;
        });
    }

    getFAQ(key: string, guild: string): any {
        return this.execute(db => db.prepare(`SELECT * FROM faqs AS f JOIN faq_keys AS fk ON f.id = fk.faq_id WHERE fk.key = ? AND fk.guild = ?`).get(key, guild));
    }

    getFAQs(guild: string): any {
        return this.execute(db => db.prepare(`SELECT * FROM faqs AS f JOIN faq_keys AS fk ON f.id = fk.faq_id WHERE fk.guild = ?`).all(guild));
    }

    storeAPIKey(user: string, guild: string, key: string, gw2account: string, accountName: string, role: string): boolean|undefined {
        let sql = `INSERT INTO registrations(user, guild, api_key, gw2account, account_name, registration_role) VALUES(?,?,?,?,?,?)`;
        return this.execute(db => {
                    try {
                        db.prepare(sql).run(user, guild, key, gw2account, accountName, role);
                        return true;
                    } catch(err) {
                        Util.log("error", "DB.js", "Error while trying to store API key: {0}.".formatUnicorn(err.message));
                        return false;
                    }
                });
    }

    /**
    * Revalidates all keys that have been put into the database. Note that due to rate limiting, this method implements some
    * politeness mechanisms and will take quite some time!
    * @returns {[ undefined | ( {api_key, guild, user, registration_role}, admittedRole|null ) ]} - a list of tuples, where each tuple holds a user row from the db 
    *           and the name of the role that user should have. Rows can be undefined if an error was encountered upon validation!
    */
    async revalidateKeys(): Promise<any> {
        let semaphore = new Semaphore(REAUTH_MAX_PARALLEL_REQUESTS);
        return this.execute(db => 
            Promise.all(
                db.prepare(`SELECT api_key, guild, user, registration_role, account_name FROM registrations ORDER BY guild`).all()
                    .map(async r => {
                        let release = await semaphore.acquire();
                        let res = await Util.validateWorld(r.api_key).then(
                            admittedRole => [r, admittedRole],
                            error => {
                                if(error === Util.validateWorld.ERRORS.invalid_key) {
                                    // while this was an actual error when initially registering (=> tell user their key is invalid),
                                    // in the context of revalidation this is actually a valid case: the user must have given a valid key
                                    // upon registration (or else it would not have ended up in the DB) and has now deleted the key
                                    // => remove the validation role from the user
                                    return [r,false];
                                } else {
                                    Util.log("error", "DB.js", "Error occured while revalidating key {0}. User will be excempt from this revalidation.".formatUnicorn(r.api_key));
                                    return undefined;
                                }
                            }
                        );
                        await Timeout.set(REAUTH_DELAY);
                        release();
                        return res;
                    })
            )
        );
    }

    deleteKey(key: string): boolean|undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM registrations WHERE api_key = ?`).run(key)
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null);
            return changes > 0;
        });
    }

    dummy(): void {
        return; // not testing rn
        let sql = `INSERT INTO registrations(user, api_key, gw2account) VALUES
        (?,?,?),
        (?,?,?)
        `;
        this.execute(db => db.prepare(sql).run([
            100, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-B88DD2202076',"asd", 
            230947151931375617, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-000000000000',"dsa"
            ]));
    }

    storeCronjob(schedule: string, command: string, args: string, creator: string, guild: string) : number|undefined {
        let sql = `INSERT INTO cronjobs(schedule, command, arguments, created_by, guild) VALUES (?,?,?,?,?)`;
        return this.execute(db => {
            let lastId = undefined;
            db.transaction((_) => {
                db.prepare(sql).run(schedule, command, args, creator, guild);
                lastId = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
            })(null);
            return lastId;
        });
    }

    getCronjobs(): any {
        return this.execute(db => db.prepare(`SELECT * FROM cronjobs`).all());
    }

    deleteCronjob(id: number): boolean|undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM cronjobs WHERE id = ?`).run(id)
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null);
            return changes > 0;
        });
    }

    storePermanentRole(user: string, guild: string, role: string) : boolean {
        let sql = `INSERT INTO permanent_roles(guild, user, role) VALUES(?,?,?)`;
        return this.execute(db => {
                    try {
                        db.prepare(sql).run(guild, user, role);
                        return true;
                    } catch(err) {
                        Util.log("error", "DB.js", "Error while trying to store permanent role: {0}.".formatUnicorn(err.message));
                        return false;
                    }
                });
    }

    getPermanentRoles(user: string, guild: string) : string[] {
        return this.execute(db => db.prepare(`SELECT role FROM permanent_roles WHERE guild = ? AND user = ?`).all(guild, user).map(r => r.role));
    }

    deletePermanentRole(user: string, guild: string, role: string): boolean {
        let sql = `DELETE FROM permanent_roles WHERE guild = ? AND user = ? AND role = ?`;
        return this.execute(db => {
                    try {
                        db.prepare(sql).run(guild, user, role);
                        return true;
                    } catch(err) {
                        Util.log("error", "DB.js", "Error while trying to store permanent role: {0}.".formatUnicorn(err.message));
                        return false;
                    }
                });        
    }

    findDuplicateRegistrations(): any {
        return this.execute(db => db.prepare(`SELECT group_concat(user, ',') AS users, COUNT(*) AS count, gw2account FROM registrations GROUP BY gw2account HAVING count > 1`).all());
    }
}