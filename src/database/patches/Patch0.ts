import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Adds the initial schema
 */
export class Patch0 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.tableExists("registrations")
            && this.tableExists("cronjobs")
            && this.tableExists("faqs")
            && this.tableExists("faq_keys")
            && this.indexExists("faq_keys", "index_faq_keys_key");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        const sqls = [
            `CREATE TABLE IF NOT EXISTS registrations
             (
                 id                INTEGER PRIMARY KEY AUTOINCREMENT,
                 user              TEXT NOT NULL,
                 guild             TEXT NOT NULL,
                 api_key           TEXT NOT NULL,
                 gw2account        TEXT NOT NULL,
                 registration_role TEXT,
                 created           TIMESTAMP DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
                 UNIQUE (user, guild) ON CONFLICT REPLACE,
                 UNIQUE (guild, api_key)
             )`, // no ON CONFLICT for second unique, that's an actual error
            `CREATE TABLE IF NOT EXISTS cronjobs
             (
                 id         INTEGER PRIMARY KEY AUTOINCREMENT,
                 schedule   TEXT NOT NULL,
                 command    TEXT NOT NULL,
                 arguments  TEXT,
                 created_by TEXT NOT NULL,
                 guild      TEXT NOT NULL,
                 created    TIMESTAMP DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
             )`,
            `CREATE TABLE IF NOT EXISTS faqs
             (
                 id         INTEGER PRIMARY KEY AUTOINCREMENT,
                 text       TEXT,
                 created_by TEXT NOT NULL,
                 guild      TEXT NOT NULL,
                 created    TIMESTAMP DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
             )`,
            `CREATE TABLE IF NOT EXISTS faq_keys
             (
                 id         INTEGER PRIMARY KEY AUTOINCREMENT,
                 key        TEXT NOT NULL,
                 faq_id     INTEGER,
                 created_by TEXT NOT NULL,
                 guild      TEXT NOT NULL,
                 created    TIMESTAMP DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
                 UNIQUE (key) ON CONFLICT REPLACE,
                 FOREIGN KEY (faq_id) REFERENCES faqs (id)
                     ON UPDATE CASCADE
                     ON DELETE CASCADE
             )`,
            `CREATE INDEX IF NOT EXISTS index_faq_keys_key ON faq_keys (key)`
        ];
        sqls.forEach(sql => this.connection.exec(sql));
    }
}