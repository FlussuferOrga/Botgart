import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Adds the discord_log_channels table.
 */
export class Patch5 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.tableExists("discord_log_channels");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`
            CREATE TABLE discord_log_channels(
              discord_log_channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
              guild TEXT NOT NULL,
              type TEXT NOT NULL,
              channel TEXT NOT NULL
            )`).run();
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`DROP TABLE IF EXISTS discord_log_channels`).run();
        this.dbcommit();
    }
}