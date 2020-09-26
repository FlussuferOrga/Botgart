import * as discord from "discord.js";
import { AbstractDbRepository } from "./AbstractDbRepository";

export class FishingRepository extends AbstractDbRepository{
    /**
     * Randomly selects a Fish.
     * Weight is already randomly selected.
     * Fish with higher rarity value are more commonly found.
     * @returns a randomly selected Fish.
     */
    public getRandomFish(): Fish {
        return this.execute(db => db.prepare(`
                SELECT 
                    fish_id,
                    name,
                    image, 
                    rarity,
                    ABS(RANDOM()) % (max_weight - min_weight) + min_weight AS weight,
                    points_per_gramm,
                    reel_time_factor
                FROM 
                    fish 
                ORDER BY 
                    ABS(RANDOM() / CAST(-9223372036854775808 AS REAL)) * rarity DESC         
                LIMIT 
                    1
        `).get())
    }

    /**
     * Stores that a user has caught a fish.
     * @param user: who caught the fish .
     * @param fish: the fish that was caught
     */
    public catchFish(user: discord.User, fish: Fish): void {
        this.execute(db => db.prepare(`
            INSERT INTO caught_fish(fish_id, weight, user)
            VALUES (?,?,?)
        `).run(fish.fish_id, fish.weight, user.id));
    }

    /**
     * Retrieves the ladder for fishing.
     * @param length: the number of ladder enties that should be retrieved.
     * @returns the ladder
     */
    public fishLadder(length: number = 10): FishLadderEntry[] {
        return this.execute(db => db.prepare(`
            SELECT 
                user,
                ROW_NUMBER() OVER (ORDER BY SUM(weight) DESC) AS rank,
                SUM(weight) AS total_weight,
                COUNT(*) AS number_of_fish
            FROM 
                caught_fish
            GROUP BY 
                user 
            ORDER BY 
                SUM(weight) DESC
            LIMIT 
                ?
        `).all(length));
    }

}

export interface Fish {
    readonly fish_id: number,
    readonly name: string,
    readonly image: string,
    readonly rarity: number,
    readonly weight: number,
    readonly points_per_gramm: number,
    readonly reel_time_factor: number
}

export interface FishLadderEntry {
    readonly user: string,
    readonly rank: number,
    readonly total_weight: number,
    readonly number_of_fish: number
}