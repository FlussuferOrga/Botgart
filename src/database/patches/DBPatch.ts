import * as sqlite3 from "better-sqlite3";
import { Database } from "../Database";
import { Patch } from "./Patch";

export class DBPatch extends Patch {
    protected db: Database;
    protected connection: sqlite3.Database;

    constructor(db: Database) {
        super();
        this.db = db;
        this.connection = db.openConnection(null);
    }

    protected async commit(): Promise<void> {
        this.dbcommit();
    }

    protected async rollback(): Promise<void> {
        this.dbrollback();
    }

    protected viewExists(name: string): boolean {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='view' AND name=?").all(name).length > 0;
    }

    protected tableExists(name: string): boolean {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(name).length > 0;
    }

    protected columnExists(table: string, column: string): boolean {
        return this.connection.prepare("PRAGMA table_info(" + table + ")").all() // can't use prepared parameters for some reason in this instance
            .filter(col => col.name === column).length > 0;
    }

    protected columnHasDefault(table: string, column: string, def: string): boolean {
        return this.connection.prepare("PRAGMA table_info(" + table + ")").all() // can't use prepared parameters for some reason in this instance
            .filter(col => col.name === column)
            .filter(col => col.dflt_value === def).length > 0;
    }

    protected indexExists(table: string, index: string): boolean {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? AND name=?").all(table, index).length > 0;
    }

    protected dbbegin(): void {
        this.connection.prepare("BEGIN").run();
    }

    protected dbcommit(): void {
        if (this.connection.inTransaction) {
            this.connection.prepare("COMMIT").run();
        }
    }

    protected dbrollback(): void {
        this.connection.prepare("ROLLBACK").run();
    }

    public close(): void {
        this.connection.close();
    }
}