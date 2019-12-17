import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Adds the commander performance and achievement tables
* also the environment variables
*/
export class Patch8 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.tableExists("ts_leads") 
            && this.tableExists("player_achievements")
            && this.tableExists("player_achievement_posts")
            && this.tableExists("matchups")
            && this.tableExists("matchup_factions")
            && this.tableExists("matchup_details")
            && this.tableExists("matchup_objectives")
            && this.tableExists("environment_variables")
            && this.tableExists("player_activities")
    }

    protected async apply(): Promise<void> {
        this.dbbegin();

        this.connection.prepare(`
          CREATE TABLE environment_variables(
            environment_variable_id INTEGER PRIMARY KEY,
            guild TEXT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            value TEXT,
            UNIQUE(guild, name)
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE ts_leads(
            ts_lead_id INTEGER PRIMARY KEY,
            gw2account TEXT NOT NULL,
            ts_channel TEXT,
            start DATETIME NOT NULL,
            end DATETIME NOT NULL
          )`).run();

        this.connection.prepare(`
          CREATE TABLE player_activities( 
            player_activity_id INTEGER PRIMARY KEY,
            gw2account TEXT NOT NULL, 
            activity TEXT NOT NULL,
            start DATETIME NOT NULL, 
            end DATETIME NOT NULL
          )`).run();

        this.connection.prepare(`
          CREATE TABLE player_achievements(
            player_achievement_id INTEGER PRIMARY KEY,
            achievement_name TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            awarded_by TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )`).run();

        this.connection.prepare(`
          CREATE TABLE player_achievement_posts(
            player_achievement_post_id INTEGER PRIMARY KEY, 
            player_achievement_id INTEGER NOT NULL,
            guild TEXT NOT NULL,
            channel TEXT NOT NULL,
            message TEXT NOT NULL,
            FOREIGN KEY(player_achievement_id) REFERENCES player_achievements(player_achievement_id)
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchups(
            matchup_id INTEGER PRIMARY KEY,
            start DATETIME NOT NULL,
            end DATETIME NOT NULL
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_factions( 
            matchup_faction_id INTEGER PRIMARY KEY, 
            matchup_id INTEGER,
            colour TEXT, 
            world_id INTEGER, 
            FOREIGN KEY(matchup_id) REFERENCES matchups(matchup_id),
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
            matchup_objective_id INTEGER PRIMARY KEY,
            matchup_id INTEGER,
            objective_id TEXT NOT NULL,
            map TEXT NOT NULL,
            owner TEXT,
            type TEXT NOT NULL,
            points_tick INTEGER, 
            points_capture INTEGER,
            last_flipped DATE, 
            yaks_delivered INTEGER,
            tier INTEGER,
            FOREIGN KEY(matchup_id) REFERENCES matchups(matchup_id),
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
        this.connection.prepare(`DROP TABLE IF EXISTS player_achievement_posts`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS player_achievements`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS ts_leads`).run();      

        this.connection.prepare(`DROP TABLE IF EXISTS matchup_objectives`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup_details`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup_factions`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchups`).run();

        this.connection.prepare(`DROP TABLE IF EXISTS player_activities`).run();

        this.connection.prepare(`DROP TABLE IF EXISTS environment_variables`).run();
        this.dbcommit()
    }
}