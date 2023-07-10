import * as discord from "discord.js";
import { AbstractDbRepository } from "./AbstractDbRepository";
import { Fish } from "../mikroorm/entities/Fish";
import { CaughtFish } from "../mikroorm/entities/CaughtFish";
import { RandomFish } from "../mikroorm/entities/RandomFish";
import { QueryOrder, UseRequestContext } from "@mikro-orm/core";
import { FishingLadder } from "../mikroorm/entities/FishingLadder";

export class FishingRepository extends AbstractDbRepository {
    /**
     * Randomly selects a Fish.
     * Weight is already randomly selected.
     * Fish with higher rarity value are more commonly found.
     * @returns a randomly selected Fish.
     */
    public async getRandomFish(): Promise<RandomFish> {
        const awaited = await this.orm.em.getRepository(RandomFish).findAll();
        if (awaited === undefined || awaited.length == 0) {
            throw Error("No fish found in database");
        }
        return awaited[0];
    }

    /**
     * Stores that a user has caught a fish.
     * @param user: who caught the fish .
     * @param fish: the fish that was caught
     */
    @UseRequestContext()
    public async catchFish(user: discord.User, fish: GeneratedFish): Promise<void> {
        const caughtFish = new CaughtFish();
        caughtFish.fish_id = this.orm.em.getReference(Fish, fish.fish_id);
        caughtFish.weight = fish.weight;
        caughtFish.user = user.id;
        await this.orm.em.persistAndFlush(caughtFish);
    }

    /**
     * Retrieves the ladder for fishing.
     * @param length: the number of ladder enties that should be retrieved.
     * @returns the ladder
     */
    public async fishLadder(length = 10): Promise<FishingLadder[]> {
        return await this.orm.em.getRepository(FishingLadder).findAll({
            limit: length,
            orderBy: { total_weight: QueryOrder.DESC },
        });
    }
}

export interface GeneratedFish {
    readonly fish_id: number;
    readonly name: string;
    readonly image: string;
    readonly rarity: number;
    readonly weight: number;
    readonly points_per_gramm: number;
    readonly reel_time_factor: number;
}

export interface FishLadderEntry {
    readonly user: string;
    readonly rank: number;
    readonly total_weight: number;
    readonly number_of_fish: number;
}
