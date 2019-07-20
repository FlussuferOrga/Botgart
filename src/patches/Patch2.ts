import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Adds the permanent_roles table.
*/
export class Patch2 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected satisfied(): boolean { 
        return this.tableExists("permanent_roles");
    }

    protected apply(): void {
        this.dbbegin();
        this.connection.prepare(`
            CREATE TABLE IF NOT EXISTS permanent_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild TEXT NOT NULL,
                user TEXT NOT NULL,
                role TEXT NOT NULL,
                created TIMESTAMP DEFAULT (datetime('now','localtime')),
                UNIQUE(guild, user, role)
        )`).run();
    }

    public revert(): void {
        this.dbbegin();
        this.connection.prepare(`DROP TABLE IF EXISTS permanent_roles`).run();
        this.dbcommit();
    }

    protected commit(): void { this.dbcommit(); }

    protected rollback(): void { this.dbrollback(); }
}