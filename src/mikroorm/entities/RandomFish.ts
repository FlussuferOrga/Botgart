import { EntityManager } from "@mikro-orm/better-sqlite";
import { Entity, Property } from "@mikro-orm/core";

@Entity({
    expression: (em: EntityManager) => {
        return em.raw(`SELECT fish_id,
                              name,
                              image,
                              rarity,
                              ABS(RANDOM()) % (max_weight - min_weight) + min_weight AS weight,
                              points_per_gramm,
                              reel_time_factor
                       FROM fish
                       ORDER BY ABS(RANDOM() / CAST(-9223372036854775808 AS REAL)) * rarity DESC
                       LIMIT 1`);
    },
})
export class RandomFish {
    @Property()
    fish_id!: number;

    @Property()
    name!: string;

    @Property()
    image!: string;

    @Property()
    rarity!: number;

    @Property()
    weight!: number;

    @Property()
    points_per_gramm!: number;

    @Property()
    reel_time_factor!: number;
}
