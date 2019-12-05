import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Adds the commander performance and achievement tables
*/
export class Patch8 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.tableExists("lead_durations") 
            && this.tableExists("achievements")
            && this.tableExists("player_achievements")
            && this.tableExists("matchup")
            && this.tableExists("matchup_factions")
            && this.tableExists("matchup_details")
            && this.tableExists("matchup_objectives")
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`
          CREATE TABLE lead_durations(
            lead_duration_id INTEGER PRIMARY KEY,
            gw2account TEXT NOT NULL,
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
            FOREIGN KEY(achievement_id) REFERENCES achievements(achievement_id)
          )`).run();

        this.connection.prepare(`
          CREATE TABLE matchup(
            matchup_id INTEGER PRIMARY KEY
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_factions( 
            matchup_faction_id INTEGER PRIMARY KEY, 
            matchup_id INTEGER,
            colour TEXT, 
            world_id INTEGER, 
            world_name TEXT,
            FOREIGN KEY(matchup_id) REFERENCES matchup(matchup_id),
            CHECK(colour IN ('Red','Green','Blue'))
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_details(
            matchup_details_id INTEGER PRIMARY KEY, 
            matchup_id INTEGER,
            faction TEXT,
            deaths INTEGER,
            kills INTEGER,
            victory_points INTEGER,
            tick INTEGER,
            FOREIGN KEY(matchup_id) REFERENCES matchup(matchup_id),
            CHECK(faction IN ('Red','Blue','Green'))
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_objectives(
            matchup_objectives_id INTEGER PRIMARY KEY,
            matchup_id INTEGER,
            objective_id TEXT NOT NULL,
            map TEXT NOT NULL,
            owner TEXT,
            type TEXT NOT NULL,
            points_tick INTEGER, 
            points_capture,
            last_flipped DATE, 
            yaks_delivered INTEGER,
            tier INTEGER,
            FOREIGN KEY(matchup_id) REFERENCES matchup(matchup_id),
            CHECK(0 <= tier AND tier <= 3),
            CHECK(map IN ('Center', 'RedHome', 'GreenHome', 'BlueHome')),
            CHECK(owner IN ('Red','Blue','Green','Neutral'))
            CHECK(type IN ('Spawn','Camp','Castle','Tower','Keep','Mercenary','Ruins')) -- make sure to ignore spawn!
          )
          `).run()
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`DROP TABLE IF EXISTS achievement_progress`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS player_achievements`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS achievements`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS lead_durations`).run();      

        this.connection.prepare(`DROP TABLE IF EXISTS matchup_objectives`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup_details`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup_factions`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup`).run();
        this.dbcommit()
    }
}