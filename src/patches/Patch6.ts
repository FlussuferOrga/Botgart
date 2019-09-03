import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Adds the tables for reset lead rostering
*/
export class Patch6 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.tableExists("reset_leaders") && this.tableExists("reset_rosters");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`
            CREATE TABLE reset_rosters(
              reset_roster_id INTEGER PRIMARY KEY AUTOINCREMENT, 
              week_number INTEGER NOT NULL,
              guild TEXT NOT NULL,
              channel TEXT NOT NULL,
              message TEXT NOT NULL         
            )`).run();
        this.connection.prepare(`
            CREATE TABLE reset_leaders(
              reset_leader_id INTEGER PRIMARY KEY AUTOINCREMENT,
              reset_roster_id INTEGER,
              player TEXT NOT NULL,
              FOREIGN KEY(reset_roster_id) REFERENCES reset_rosters(reset_roster_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE              
            )`).run();
      }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`DROP TABLE IF EXISTS reset_leaders`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS reset_rosters`).run();
        this.dbcommit();
    }
}