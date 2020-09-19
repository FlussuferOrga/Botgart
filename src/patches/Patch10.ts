import { Database } from "../DB";
import { DBPatch } from "./DBPatch";

/**
* Fishing System
*/
export class Patch10 extends DBPatch {
   constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.columnExists("reset_leaders", "visible");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        this.connection.prepare(`
            CREATE TABLE new_reset_leaders(
              reset_leader_id INTEGER PRIMARY KEY AUTOINCREMENT,
              reset_roster_id INTEGER,
              map TEXT NOT NULL,
              player TEXT NOT NULL,
              visible BOOLEAN NOT NULL,
              FOREIGN KEY(reset_roster_id) REFERENCES reset_rosters(reset_roster_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
            )`).run();

        // move the data over
        this.connection.prepare(`
            INSERT INTO new_reset_leaders(reset_leader_id, reset_roster_id, map, player, visible)
            SELECT rl.reset_leader_id, rl.reset_roster_id, rl.map, rl.player, FALSE
            FROM reset_leaders AS rl
        `).run();
        // delete old table and rename new one
        this.connection.prepare(`DROP TABLE reset_leaders`).run();
        this.connection.prepare(`ALTER TABLE new_reset_leaders RENAME TO reset_leaders`).run();
        this.connection.pragma("foreign_keys = ON");
      }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        this.connection.prepare(`
            CREATE TABLE new_reset_leaders(
              reset_leader_id INTEGER PRIMARY KEY AUTOINCREMENT,
              reset_roster_id INTEGER,
              map TEXT NOT NULL,
              player TEXT NOT NULL,
              FOREIGN KEY(reset_roster_id) REFERENCES reset_rosters(reset_roster_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE   
            )`).run();

        // move the data over
        this.connection.prepare(`
            INSERT INTO new_reset_leaders(reset_leader_id, reset_roster_id, map, player)
            SELECT rl.reset_leader_id, rl.reset_roster_id, rl.map, rl.player
            FROM reset_leaders AS rl
        `).run();
        // delete old table and rename new one
        this.connection.prepare(`DROP TABLE reset_leaders`).run();
        this.connection.prepare(`ALTER TABLE new_reset_leaders RENAME TO reset_leaders`).run();
        this.connection.pragma("foreign_keys = ON");
        this.dbcommit();
    }
}
