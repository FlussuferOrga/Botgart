import betterSqlite3 from "better-sqlite3";
import { logger } from "../util/Logging";

const LOG = logger();

export class Database {
    public static getInstance(databaseFilePath) {
        const database = new Database(databaseFilePath);
        database.initSchema();
        LOG.info("Database initialised.");
        return database;
    }

    readonly file: string;

    private constructor(file: string) {
        this.file = file;
    }

    // NOTE: https://github.com/orlandov/node-sqlite/issues/17
    // sqlite3 and node don't work well together in terms of large integers.
    // Therefore, all big numbers are stored as strings.
    // As a consequence, === can't be used, when checking them.
    /**
     * Initial schema. All patches should be applied after
     * creating the init.
     */
    public initSchema(): void {
        const sqls = [
            `CREATE TABLE IF NOT EXISTS registrations
             (
                 id                INTEGER PRIMARY KEY AUTOINCREMENT,
                 user              TEXT NOT NULL,
                 guild             TEXT NOT NULL,
                 api_key           TEXT NOT NULL,
                 gw2account        TEXT NOT NULL,
                 registration_role TEXT,
                 created           TIMESTAMP DEFAULT (datetime('now', 'localtime')),
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
                 created    TIMESTAMP DEFAULT (datetime('now', 'localtime'))
             )`,
            `CREATE TABLE IF NOT EXISTS faqs
             (
                 id         INTEGER PRIMARY KEY AUTOINCREMENT,
                 text       TEXT,
                 created_by TEXT NOT NULL,
                 guild      TEXT NOT NULL,
                 created    TIMESTAMP DEFAULT (datetime('now', 'localtime'))
             )`,
            `CREATE TABLE IF NOT EXISTS faq_keys
             (
                 id         INTEGER PRIMARY KEY AUTOINCREMENT,
                 key        TEXT NOT NULL,
                 faq_id     INTEGER,
                 created_by TEXT NOT NULL,
                 guild      TEXT NOT NULL,
                 created    TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                 UNIQUE (key) ON CONFLICT REPLACE,
                 FOREIGN KEY (faq_id) REFERENCES faqs (id)
                     ON UPDATE CASCADE
                     ON DELETE CASCADE
             )`,
            "CREATE INDEX IF NOT EXISTS index_faq_keys_key ON faq_keys (key)"
        ];
        sqls.forEach(sql => this.execute(db => db.prepare(sql).run()));
    }

    private openConnection(state: string[]): betterSqlite3.Database {
        const options = {
            verbose: (message, additionalArgs) => {
                state.push(message);
                // LOG.debug("Sqlite Query:\n" + message, additionalArgs)
            }
        };
        const db = betterSqlite3(this.file, options);
        db.pragma("foreign_keys = ON");
        return db;
    }

    /**
     * Executes an SQL statement and handles errors, as well as closing the DB connection afterwards.
     * f: lambda expression taking the opened sqlite3 connection to run queries on.
     * returns: the result of the lambda.
     */
    public execute<T>(f: (sqlite3) => T): T | undefined {
        const queries: string[] = [];
        const db = this.openConnection(queries);
        const start: number = new Date().getTime();

        let res: T | undefined;
        try {
            res = f(db);
        } catch (err) {
            res = undefined;
            LOG.error(`DB execute: ${err["message"]} (stack: ${new Error().stack})`);
        } finally {
            const end = new Date().getTime();
            const time = end - start;
            if (time > 5000) {
                LOG.debug(`Sqlite Execution took long: ${time}ms: \n` + queries.join("\n---\n"));
            }
        }

        db.close();
        return res;
    }
}