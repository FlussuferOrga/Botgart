import { AbstractDbRepository } from "./AbstractDbRepository.js";
import { Fish } from "../mikroorm/entities/Fish.js";
import { CaughtFish } from "../mikroorm/entities/CaughtFish.js";
import { RandomFish } from "../mikroorm/entities/RandomFish.js";
import { QueryOrder } from "@mikro-orm/core";
import { FishingLadder } from "../mikroorm/entities/FishingLadder.js";
import { User } from "discord.js";

export class FishingRepository extends AbstractDbRepository {
    /**
     * Randomly selects a Fish.
     * Weight is already randomly selected.
     * Fish with higher rarity value are more commonly found.
     * @returns a randomly selected Fish.
     */
    public async getRandomFish(): Promise<RandomFish> {
        const awaited = await this.orm.em.getRepository(RandomFish).createQueryBuilder().limit(1).getSingleResult();
        if (awaited === null) {
            throw Error("No fish found in database");
        }
        return awaited;
    }

    /**
     * Stores that a user has caught a fish.
     */
    public async catchFish(user: User, fish: RandomFish): Promise<void> {
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
export interface FishLadderEntry {
    readonly user: string;
    readonly rank: number;
    readonly total_weight: number;
    readonly number_of_fish: number;
}
