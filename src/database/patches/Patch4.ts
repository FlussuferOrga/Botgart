import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Adds the command_permissions table.
 */
export class Patch4 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.tableExists("command_permissions") && this.viewExists("command_permissions_agg");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`
            CREATE TABLE command_permissions(
              command_permissions_id INTEGER PRIMARY KEY AUTOINCREMENT,
              command TEXT NOT NULL, -- primary name of the command
              receiver TEXT NOT NULL, -- either a unique user ID or a unique role ID. Discord uses Twitter-Snowflakes as IDs, so they should be compatible with each other and still unique https://discordapp.com/developers/docs/reference
              type TEXT NOT NULL, 
              guild TEXT NOT NULL,
              value INTEGER NOT NULL, -- a positive or negative value to either allow or forbid the command
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- when this permission was granted
              UNIQUE(command, receiver),
              CHECK(type IN ('user','role','other'))
            )`).run();

        this.connection.prepare(`
            CREATE VIEW command_permissions_agg(command, receiver, type, guild, value) AS 
              SELECT 
                cp.command,
                cp.receiver,
                cp.type,
                cp.guild,
                SUM(cp.value)
              FROM 
                command_permissions AS cp 
              GROUP BY 
                cp.command, cp.receiver, cp.type, cp.guild
            `).run();
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`DROP VIEW IF EXISTS command_permissions_agg`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS command_permissions`).run();
        this.dbcommit();
    }
}