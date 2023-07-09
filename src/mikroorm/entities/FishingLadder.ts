import { EntityManager } from "@mikro-orm/better-sqlite";
import { Entity, Property, QueryOrder } from "@mikro-orm/core";
import { CaughtFish } from "./CaughtFish";

@Entity({
    expression: (em: EntityManager) => {
        return em
            .createQueryBuilder(CaughtFish)
            .select(["ROW_NUMBER() OVER (ORDER BY SUM(weight) DESC) AS rank", "SUM(weight) AS total_weight", "user", "count(*) as number_of_fish"])
            .groupBy("user");
    },
})
export class FishingLadder {
    @Property()
    user!: string;

    @Property()
    rank!: number;

    @Property()
    total_weight!: number;

    @Property()
    number_of_fish!: number;
}
