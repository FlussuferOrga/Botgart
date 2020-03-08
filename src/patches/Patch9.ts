import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Fishing System
*/
export class Patch9 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.tableExists("fish") 
            && this.tableExists("caught_fish")
            && this.viewExists("fishing_leaderboard")
    }

    protected async apply(): Promise<void> {
        this.dbbegin();

        this.connection.prepare(`
          CREATE TABLE fish(
              fish_id INTEGER PRIMARY KEY,
              name TEXT,
              image TEXT,
              rarity INTEGER DEFAULT 5,
              min_weight INTEGER,
              max_weight INTEGER,
              points_per_gramm FLOAT DEFAULT 1.0,
              CHECK(rarity BETWEEN 1 AND 10),
              CHECK(min_weight > 0),
              CHECK(min_weight < max_weight)
          )
          `).run();

        this.connection.prepare(`
            CREATE TABLE caught_fish(
                caught_id INTEGER PRIMARY KEY, 
                fish_id INTEGER,
                weight INTEGER,
                user TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY(fish_id) REFERENCES fish(fish_id)
                ON DELETE CASCADE
            )
            `).run();

        this.connection.prepare(`
            CREATE VIEW fishing_leaderboard(user, points) AS 
            SELECT 
                cf.user, 
                TOTAL(cf.weight * f.points_per_gramm)
            FROM 
                caught_fish AS cf 
                JOIN fish AS f 
                  ON cf.fish_id = f.fish_id
            GROUP BY 
                cf.user
            `).run();
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(`DROP VIEW IF EXISTS fishing_leaderboard`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS caught_fish`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS fish`).run();
        this.dbcommit()
    }
}