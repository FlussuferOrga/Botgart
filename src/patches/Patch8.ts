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
            && this.tableExists("stats_snapshots")
            && this.tableExists("objectives_snapshots")
            && this.tableExists("matchup_factions")
            && this.tableExists("matchup_stats")
            && this.tableExists("matchup_objectives")
            && this.tableExists("environment_variables")
            && this.tableExists("player_activities")
            && this.tableExists("wvw_factions")
            && this.tableExists("wvw_maps")            
            && this.viewExists("captured_objectives")
            && this.viewExists("map_ticks")
            && this.viewExists("total_ticks")
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
            CREATE TABLE wvw_factions(
                colour TEXT NOT NULL,
                UNIQUE(colour)
            )
            `).run();

        this.connection.prepare(`
            INSERT INTO wvw_factions(colour) VALUES ('Red'),('Green'),('Blue'),('Neutral')
            `).run();

        this.connection.prepare(`
            CREATE TABLE wvw_maps(
                mapname TEXT NOT NULL,
                UNIQUE(mapname)
            )
            `).run();

        this.connection.prepare(`
            INSERT INTO wvw_maps(mapname) VALUES ('RedHome'),('GreenHome'),('BlueHome'),('Center')
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
            start TIMESTAMP NOT NULL, 
            end TIMESTAMP NOT NULL
          )`).run();

        this.connection.prepare(`
          CREATE TABLE player_achievements(
            player_achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
            achievement_name TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            awarded_by TEXT,
            timestamp TIMESTAMP DEFAULT (datetime('now','localtime'))
          )`).run();

        this.connection.prepare(`
          CREATE TABLE player_achievement_posts(
            player_achievement_post_id INTEGER PRIMARY KEY, 
            player_achievement_id INTEGER NOT NULL,
            guild TEXT NOT NULL,
            channel TEXT NOT NULL,
            message TEXT NOT NULL,
            FOREIGN KEY(player_achievement_id) REFERENCES player_achievements(player_achievement_id)
                ON DELETE CASCADE
          )
          `).run();
        this.connection.prepare(`
          CREATE TABLE matchups(
            matchup_id INTEGER PRIMARY KEY,
            tier INTEGER,
            start TIMESTAMP NOT NULL,
            end TIMESTAMP NOT NULL,
            CHECK(tier BETWEEN 1 AND 5),
            UNIQUE(start)
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_factions( 
            matchup_faction_id INTEGER PRIMARY KEY, 
            matchup_id INTEGER,
            colour TEXT, 
            world_id INTEGER, 
            FOREIGN KEY(matchup_id) REFERENCES matchups(matchup_id)
                ON DELETE CASCADE,
            FOREIGN KEY(colour) REFERENCES wvw_factions(colour)
                ON DELETE CASCADE
          )
          `).run();

        this.connection.prepare(`
            CREATE TABLE objectives_snapshots(
              objectives_snapshot_id INTEGER PRIMARY KEY,
              timestamp TIMESTAMP DEFAULT (datetime('now','localtime'))
            )
            `).run();

        this.connection.prepare(`
            CREATE TABLE stats_snapshots(
              stats_snapshot_id INTEGER PRIMARY KEY,
              timestamp TIMESTAMP DEFAULT (datetime('now','localtime'))
            )
            `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_stats(
            matchup_stats_id INTEGER PRIMARY KEY, 
            matchup_id INTEGER,
            snapshot_id INTEGER,
            map TEXT NOT NULL,
            faction TEXT,
            deaths INTEGER,
            kills INTEGER,
            victory_points INTEGER,
            FOREIGN KEY(matchup_id) REFERENCES matchups(matchup_id)
                ON DELETE CASCADE,
            FOREIGN KEY(snapshot_id) REFERENCES stats_snapshots(stats_snapshot_id)
                ON DELETE CASCADE,
            FOREIGN KEY(map) REFERENCES wvw_maps(mapname)
                ON DELETE CASCADE,
            FOREIGN KEY(faction) REFERENCES wvw_factions(colour)
                ON DELETE CASCADE
          )
          `).run();

        this.connection.prepare(`
          CREATE TABLE matchup_objectives(
            matchup_objective_id INTEGER PRIMARY KEY,
            matchup_id INTEGER,
            snapshot_id INTEGER,
            objective_id TEXT NOT NULL,
            map TEXT NOT NULL,
            owner TEXT,
            type TEXT NOT NULL,
            points_tick INTEGER, 
            points_capture INTEGER,
            last_flipped DATE, 
            yaks_delivered INTEGER,
            tier INTEGER,
            FOREIGN KEY(matchup_id) REFERENCES matchups(matchup_id) 
                ON DELETE CASCADE,
            FOREIGN KEY(snapshot_id) REFERENCES objectives_snapshots(objectives_snapshot_id) 
                ON DELETE CASCADE,
            FOREIGN KEY(map) REFERENCES wvw_maps(mapname)
                ON DELETE CASCADE,
            FOREIGN KEY(owner) REFERENCES wvw_factions(colour)
                ON DELETE CASCADE,
            CHECK(0 <= tier AND tier <= 3),
            CHECK(type IN ('Spawn','Camp','Castle','Tower','Keep','Mercenary','Ruins')) -- make sure to ignore spawn!
          )
          `).run()

        this.connection.prepare(`
            CREATE VIEW captured_objectives(matchup_objective_id,
                                            matchup_id,
                                            objective_id,
                                            map,
                                            type,
                                            new_snapshot_id,  
                                            new_owner,
                                            new_points_tick,
                                            new_points_capture,
                                            new_last_flipped,
                                            old_snapshot_id,
                                            old_owner,
                                            old_points_tick,
                                            old_points_capture,
                                            old_last_flipped, 
                                            old_yaks,
                                            old_tier) AS 
                WITH 
                mo AS (
                    SELECT 
                        mo.*,
                        ms.timestamp AS snapshot_timestamp
                    FROM 
                        matchup_objectives AS mo 
                        JOIN objectives_snapshots AS ms 
                          ON mo.snapshot_id = ms.objectives_snapshot_id
                )
                SELECT 
                    new.matchup_objective_id,
                    new.matchup_id,
                    new.objective_id,
                    new.map,
                    new.type,
                    new.snapshot_id          AS new_snapshot_id,   
                    new.owner                AS new_owner,
                    new.points_tick          AS new_points_tick,
                    new.points_capture       AS new_points_capture,
                    new.last_flipped         AS new_last_flipped,
                    old.snapshot_id          AS old_snapshot_id,
                    old.owner                AS old_owner,
                    old.points_tick          AS old_points_tick,
                    old.points_capture       AS old_points_capture,
                    old.last_flipped         AS old_last_flipped,  
                    old.yaks_delivered       AS old_yaks,
                    old.tier                 AS old_tier
                FROM 
                    mo AS old
                    JOIN mo AS new
                      ON old.objective_id = new.objective_id
                         AND old.snapshot_id = new.snapshot_id - 1
                         AND old.owner != new.owner
                         AND old.matchup_id = new.matchup_id
                ORDER BY 
                    new_last_flipped DESC            
            `).run();

        this.connection.prepare(`
            CREATE VIEW map_ticks(snapshot_id, faction, map, tick) AS
                SELECT
                    snapshot_id,
                    owner,
                    map,
                    SUM(points_tick)
                FROM 
                    matchup_objectives
                GROUP BY 
                    snapshot_id, owner, map
            `).run();

        this.connection.prepare(`
            CREATE VIEW total_ticks(snapshot_id, faction, tick) AS
                SELECT
                    snapshot_id,
                    faction,
                    SUM(tick)
                FROM 
                    map_ticks
                GROUP BY 
                    snapshot_id, faction
            `).run();
    }

    public async revert(): Promise<void> {
        this.dbbegin();

        this.connection.prepare(`DROP VIEW IF EXISTS captured_objectives`).run();
        this.connection.prepare(`DROP VIEW IF EXISTS map_ticks`).run();
        this.connection.prepare(`DROP VIEW IF EXISTS total_ticks`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS achievement_progress`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS player_achievement_posts`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS player_achievements`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS ts_leads`).run();      

        this.connection.prepare(`DROP TABLE IF EXISTS matchup_objectives`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup_stats`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS matchup_factions`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS stats_snapshots`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS objectives_snapshots`).run();

        this.connection.prepare(`DROP TABLE IF EXISTS matchups`).run();

        this.connection.prepare(`DROP TABLE IF EXISTS player_activities`).run();

        this.connection.prepare(`DROP TABLE IF EXISTS wvw_factions`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS wvw_maps`).run();        

        this.connection.prepare(`DROP TABLE IF EXISTS environment_variables`).run();
        this.dbcommit()
    }
}