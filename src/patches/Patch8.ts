import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Adds the commander performance tables
*/
export class Patch9 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.tableExists("lead_durations") 
            && this.tableExists("achievements")
            && this.tableExists("player_achievements")
            && this.tableExists("achievement_progress")
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`
          CREATE TABLE lead_durations(
            lead_duration_id INTEGER PRIMARY KEY,
            gw2account TEXT NOT NULL
            ts_channel TEXT,
            start DATETIME NOT NULL,
            stop DATETIME NOT NULL
          )`).run();

        this.connection.prepare(`
          CREATE TABLE achievements(
            achievement_id INTEGER PRIMARY KEY,
            guild_id TEXT NOT NULL,
            role_name TEXT
          )`).run();

        this.connection.prepare(`
          CREATE TABLE player_achievements(
            player_achievements_id INTEGER PRIMARY KEY,
            achievement_id INTEGER NOT NULL,
            gw2account TEXT NOT NULL,
            achieved DATETIME DEFAULT CURRENT_TIMESTAMP,          
            FOREIGN KEY(achievement_id) REFERENCES achievements(achievement_id),
            UNIQUE(achievement_id, gw2account)
          )`).run();

        this.connection.prepare(`
          CREATE TABLE achievement_progress( 
            achievement_progress_id INTEGER PRIMARY KEY,
            gw2account TEXT NOT NULL, 
            name TEXT NOT NULL,
            value TEXT,
            type TEXT NOT NULL,
            UNIQUE(gw2account, name)
          )`)

                /*
        // discarded. May be relevant again some day.
        this.connection.prepare(`
          CREATE TABLE performances(
            performance_id INTEGER PRIMARY KEY,
            timestamp TEXT
          )`).run();

        this.connection.prepare(`
          CREATE TABLE faction_performances(
            faction_performance_id INTEGER PRIMARY KEY,
            performance_id INTEGER,
            world_id INTEGER,
            colour TEXT,
            kills INTEGER,
            deaths INTEGER,
            victory_points INTEGER,
            FOREIGN KEY(performance_id) REFERENCES performances(performance_id),
            CHECK(colour IN ('red', 'blue', 'green'))
          )`).run();
          */
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`DROP TABLE achievement_progress`).run();
        this.connection.prepare(`DROP TABLE player_achievements`).run();
        this.connection.prepare(`DROP TABLE achievements`).run();
        this.connection.prepare(`DROP TABLE lead_durations`).run();      
    }
}