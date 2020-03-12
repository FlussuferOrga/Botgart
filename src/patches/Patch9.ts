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
              reel_time_factor FLOAT DEFAULT 1.0,
              CHECK(rarity BETWEEN 1 AND 10),
              CHECK(reel_time_factor > 0),
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

        // https://imgur.com/a/Jl7FnBE
        this.connection.prepare(`
            INSERT INTO fish(name, image, rarity, min_weight, max_weight, points_per_gramm, reel_time_factor) VALUES
              ('odiosis piscis',       'https://i.imgur.com/XO1TV1j.png',  8,  1000,    3000, 1, 1.0), -- blue fish 
              ('minima pulchritudo',   'https://i.imgur.com/U4zWofT.png',  6,   500,    1200, 1, 1.0), -- lady fish  
              ('aurantium dulcis',     'https://i.imgur.com/l1bxUm1.png',  5,  1000,    3000, 1, 1.0), -- orange fish 
              ('minilodon',            'https://i.imgur.com/zf3S6LI.png',  3, 10000,   15000, 1, 0.5), -- shark regular 
              ('minilodon (shiny)',    'https://i.imgur.com/uO8y6l9.png',  1, 30000,  100000, 2, 0.4), -- shark shiny
              ('lacus zucchini',       'https://i.imgur.com/9UWTFzK.png',  5,  1000,    2000, 1, 1.0), -- green fish 
              ('limoque obvoluto',     'https://i.imgur.com/7bu5dfc.png',  5,  1000,    2000, 1, 1.0), -- flat fish 
              ('smugtopus',            'https://i.imgur.com/0uxtQk2.png',  3,  1000,    2000, 1, 0.8), -- octopus
              ('diu flexilis',         'https://i.imgur.com/N55Fxlh.png',  5,  1000,    2000, 1, 1.0), -- morrai
              ('musa acumiwater',      'https://i.imgur.com/gxirbcL.png',  5,  1000,    2000, 1, 1.0), -- sunfish
              ('ictus ictus ictus',    'https://i.imgur.com/D3wQxp6.png',  5,  1000,    2000, 1, 1.0), -- manta ray 
              ('deformis faciem tuam', 'https://i.imgur.com/izjh5Tn.png',  5,  1000,    2000, 1, 1.0), -- ghost fish 
              ('Adidas(TM)',           'https://i.imgur.com/zNg8iz7.png',  7,   700,    1300, 1, 2.5), -- boot
              ('puer magnus',          'https://i.imgur.com/C4SwLWh.png',  5,  2000,    4000, 1, 1.0), -- puffer
              ('mini minilodon',       'https://i.imgur.com/QzqHxTk.png',  5,  3000,    3600, 1, 0.9), -- baby shark
              ('Can of Tuna',          'https://i.imgur.com/SUHF7Sv.png',  7,   200,     400, 1, 2.5)  -- can
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