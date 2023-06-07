import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Adds the permanent_roles table.
 */
export class Patch2 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.tableExists("permanent_roles");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection
            .prepare(
                `
            CREATE TABLE IF NOT EXISTS permanent_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild TEXT NOT NULL,
                user TEXT NOT NULL,
                role TEXT NOT NULL,
                created TIMESTAMP DEFAULT (datetime('now','localtime')),
                UNIQUE(guild, user, role)
        )`
            )
            .run();
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare("DROP TABLE IF EXISTS permanent_roles").run();
        this.dbcommit();
    }
}
