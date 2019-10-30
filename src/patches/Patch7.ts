import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Adds the year column to the reset_roster table
*/
export class Patch7 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.columnExists("reset_rosters", "year");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        this.connection.prepare(`
            CREATE TABLE new_reset_rosters(
              reset_roster_id INTEGER PRIMARY KEY AUTOINCREMENT, 
              week_number INTEGER NOT NULL,
              year INTEGER NOT NULL,
              guild TEXT NOT NULL,
              channel TEXT NOT NULL,
              message TEXT NOT NULL,
              UNIQUE(guild, year, week_number)         
            )`).run();

        // move the data over
        this.connection.prepare(`
            INSERT INTO new_reset_rosters(reset_roster_id, week_number, year, guild, channel, message)
            SELECT rr.reset_roster_id, rr.week_number, ?, rr.guild, rr.channel, rr.message
            FROM reset_rosters AS rr
        `).run(2019);
        // delete old table and rename new one
        this.connection.prepare(`DROP TABLE reset_rosters`).run();
        this.connection.prepare(`ALTER TABLE new_reset_rosters RENAME TO reset_rosters`).run();
        this.connection.pragma("foreign_keys = ON");
      }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        this.connection.prepare(`
            CREATE TABLE new_reset_rosters(
              reset_roster_id INTEGER PRIMARY KEY AUTOINCREMENT, 
              week_number INTEGER NOT NULL,
              guild TEXT NOT NULL,
              channel TEXT NOT NULL,
              message TEXT NOT NULL,
              UNIQUE(guild, year, week_number)         
            )`).run();

        // move the data over
        this.connection.prepare(`
            INSERT INTO new_reset_rosters(reset_roster_id, week_number, guild, channel, message)
            SELECT rr.reset_roster_id, rr.week_number, rr.guild, rr.channel, rr.message
            FROM reset_rosters AS rr
        `).run();
        // delete old table and rename new one
        this.connection.prepare(`DROP TABLE reset_rosters`).run();
        this.connection.prepare(`ALTER TABLE new_reset_rosters RENAME TO reset_rosters`).run();
        this.connection.pragma("foreign_keys = ON");
    }
}