import { log } from "../Util";
import { Database } from "../DB.js";
import { Patch } from "./Patch.js";
import * as sqlite3 from "better-sqlite3";

export class DBPatch extends Patch {
    protected db: Database;
    protected connection: sqlite3.Database;

    constructor(db: Database) {
        super();
        this.db = db;
        this.connection = sqlite3.default(this.db.file, undefined);
    }

    protected async commit(): Promise<void> { this.dbcommit(); }

    protected async rollback(): Promise<void> { this.dbrollback(); }

    protected viewExists(name: string): boolean {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='view' AND name=?").all(name).length > 0;
    }

    protected tableExists(name: string): boolean {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(name).length > 0;
    }

    protected columnExists(table: string, column: string): boolean {
        return this.connection.prepare("PRAGMA table_info("+table+")").all() // can't use prepared parameters for some reason in this instance
            .filter(col => col.name === column).length > 0;
    }

    protected dbbegin(): void {
        this.connection.prepare("BEGIN").run();
    }

    protected dbcommit(): void {
        this.connection.prepare("COMMIT").run();
    }

    protected dbrollback(): void {
        this.connection.prepare("ROLLBACK").run();
    }
}