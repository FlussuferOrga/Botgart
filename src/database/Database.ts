import sqlite from "better-sqlite3";
import { logger } from "../util/Logging";

const LOG = logger();

export class Database {
    public static getInstance(databaseFilePath) {
        const database = new Database(databaseFilePath);
        LOG.info(`Database: "${databaseFilePath}".`);
        return database;
    }

    readonly file: string;

    private constructor(file: string) {
        this.file = file;
    }

    public openConnection(state: string[] | null): sqlite.Database {
        const options = {
            verbose: (message, additionalArgs) => {
                if (state !== null) {
                    state.push(message);
                }
                if (LOG.isVerboseEnabled()) {
                    LOG.verbose(`Sqlite Query: ${message}`, additionalArgs);
                }
            }
        };
        const db = sqlite(this.file, options);
        db.pragma("foreign_keys = ON");
        return db;
    }

    /**
     * Executes an SQL statement and handles errors, as well as closing the DB connection afterwards.
     * f: lambda expression taking the opened sqlite3 connection to run queries on.
     * returns: the result of the lambda.
     */
    public execute<T>(f: (sqlite3) => T): T | undefined {
        const queryList: string[] = [];
        const db = this.openConnection(queryList);
        try {
            let res: T | undefined;
            const start: number = new Date().getTime();

            try {
                res = f(db);
            } catch (err) {
                res = undefined;
                LOG.error(`DB execute: ${err["message"]} (stack: ${new Error().stack})`);
            } finally {
                if (LOG.isDebugEnabled()) {
                    const end = new Date().getTime();
                    const time = end - start;
                    if (time >= 5000) {
                        LOG.debug(`Database Execution took long (${time}ms): \n` + queryList.join("\n---\n"));
                    }
                }
            }
            return res;
        } finally {
            Database.closeConnection(db);
        }
    }

    private static closeConnection(db: sqlite.Database) {
        db.close();
    }

    private async optimize() {
        LOG.debug("Optimizing database");
        const db = sqlite(this.file);
        // optimize https://www.sqlite.org/lang_analyze.html
        db.pragma("analysis_limit=400");
        db.pragma("optimize");
        db.close();
        LOG.debug("Done optimizing database");
    }

    public async scheduleOptimize(minutes = 60) {
        LOG.info(`Scheduling database optimization every ${minutes} minutes.`);
        setInterval(this.optimize, minutes * 60 * 1000);
    }
}