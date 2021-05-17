import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

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
            && this.viewExists("fishing_leaderboard");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();

        this.connection.prepare(`
          CREATE TABLE fish(
              fish_id INTEGER PRIMARY KEY,
              name TEXT,
              image TEXT,
              rarity FLOAT DEFAULT 1.0,
              min_weight INTEGER,
              max_weight INTEGER,
              points_per_gramm FLOAT DEFAULT 1.0,
              reel_time_factor FLOAT DEFAULT 1.0,
              CHECK(rarity BETWEEN 0.1 AND 2.0),
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
                timestamp TIMESTAMP NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
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
  ('odiosis piscis',       'https://i.imgur.com/XO1TV1j.png',  1.9,  100,    300, 2, 1.0), -- blue fish 
  ('minima pulchritudo',   'https://i.imgur.com/U4zWofT.png',  1.9,   50,    120, 2, 1.0), -- lady fish  
  ('aurantium dulcis',     'https://i.imgur.com/l1bxUm1.png',  1.8,  100,    300, 2, 1.0), -- orange fish 
  ('minilodon',            'https://i.imgur.com/zf3S6LI.png',  1.5, 1000,   1500, 2, 0.5), -- shark regular 
  ('minilodon (shiny)',    'https://i.imgur.com/uO8y6l9.png',  1.4, 1000,   1500, 5, 0.4), -- shark shiny
  ('lacus zucchini',       'https://i.imgur.com/9UWTFzK.png',  1.7,  100,    200, 2, 1.0), -- green fish 
  ('limoque obvoluto',     'https://i.imgur.com/7bu5dfc.png',  1.7,  100,    200, 2, 1.0), -- flat fish 
  ('smugtopus',            'https://i.imgur.com/0uxtQk2.png',  1.6,  100,    200, 3, 0.8), -- octopus
  ('diu flexilis',         'https://i.imgur.com/N55Fxlh.png',  1.6,  100,    200, 2, 1.0), -- morrai
  ('musa acumiwater',      'https://i.imgur.com/gxirbcL.png',  1.9,  100,    200, 2, 1.0), -- sunfish
  ('ictus ictus ictus',    'https://i.imgur.com/D3wQxp6.png',  1.7,  100,    200, 2, 1.0), -- manta ray 
  ('deformis faciem tuam', 'https://i.imgur.com/izjh5Tn.png',  1.7,  100,    200, 3, 1.0), -- ghost fish 
  ('Adidas(TM)',           'https://i.imgur.com/zNg8iz7.png',  1.7,   70,    130, 1, 2.5), -- boot
  ('puer magnus',          'https://i.imgur.com/C4SwLWh.png',  1.6,  200,    400, 2, 1.0), -- puffer
  ('mini minilodon',       'https://i.imgur.com/QzqHxTk.png',  1.5,  300,    360, 2, 0.9), -- baby shark
  ('Can of Tuna',          'https://i.imgur.com/SUHF7Sv.png',  1.7,   20,     40, 1, 2.5)  -- can
          `).run();
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.prepare("DROP VIEW IF EXISTS fishing_leaderboard").run();
        this.connection.prepare("DROP TABLE IF EXISTS caught_fish").run();
        this.connection.prepare("DROP TABLE IF EXISTS fish").run();
        this.dbcommit();
    }
}