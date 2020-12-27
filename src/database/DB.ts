import * as sqlite3 from "better-sqlite3";
import * as os from  "os";
const { Worker } = require('worker_threads');

import { log } from "../Util";

interface WorkerJob {
    resolve: any,
    reject: any,
    message: { sql: string, parameters: any[] }
}

export class Database {
    public static getInstance(databaseFilePath){
        const database = new Database(databaseFilePath);
        database.init();
        database.initSchema();
        log("info", "Database initialised.");
        return database;
    }

    readonly file: string;
    private queue: WorkerJob[];

    constructor(file: string) {
        this.file = file;
        this.queue = [];        
    }

    public init() {
        //os.cpus().forEach(this.spawnWorker.bind(this));
    }

    private spawnWorker() {
        const that: Database = this;
        const worker = new Worker('./built/database/worker.js', {workerData: this.file });

        let job: WorkerJob | undefined = undefined; // Current item from the queue
        let error = null; // Error that caused the worker to crash
        let timer: NodeJS.Immediate | undefined = undefined; // Timer used for polling

        function poll() {
            if (that.queue.length > 0) {
              // If there's a job in the queue, send it to the worker
              job = that.queue.shift();
              if(job !== undefined) {
                  worker.postMessage(job.message);    
              }                  
            } else {
              // Otherwise, check again later
              timer = setImmediate(poll);
            }
        }

        worker
        .on("online", poll)
        .on("message", (result) => {
            if(job !== undefined) {
                job.resolve(result);    
                job = undefined;
            }                   
            poll(); // Check if there's more work to do
        })
        .on("error", (err) => {
            console.error(err);
            error = err;
        })
        .on("exit", (code) => {
            if(timer !== undefined) {
                clearImmediate(timer);    
            }                    
            if (job) {
                job.reject(error || new Error('worker died'));
            }    
            if (code !== 0) {
                console.error(`worker exited with code ${code}`);
                that.spawnWorker(); // Worker died, so spawn a new one
            }
        });        
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

    private getDB(): sqlite3.Database {
        const db = sqlite3.default(this.file, undefined);
        db.pragma("foreign_keys = ON");
        return db;
    }

    /**
    * Executes an SQL statement and handles errors, as well as closing the DB connection afterwards.
    * f: lambda expression taking the opened sqlite3 connection to run queries on.
    * returns: the result of the lambda.
    */
    public execute<T>(f: (sqlite3) => T): T|undefined  {
        const db = this.getDB();

        let res: T|undefined;
        try {
            res = f(db);
        } catch(err) {
            res = undefined;
            log("error", `DB execute: ${err["message"]} (stack: ${new Error().stack})`);
        }

        db.close();
        return res;
    }
   
    // worker.js
    public executeAsync<T>(sql: string, parameters: any[]) : Promise<T|undefined> {
        return new Promise((resolve, reject) => this.queue.push({resolve, reject, message: { sql, parameters }}))
    }
}
