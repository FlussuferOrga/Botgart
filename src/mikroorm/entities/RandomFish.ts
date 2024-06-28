import { EntityManager } from "@mikro-orm/better-sqlite";
import { Entity, Property, raw } from "@mikro-orm/core";
import { Fish } from "./Fish.js";

@Entity({
    expression: (em: EntityManager, where) => {
        return em
            .createQueryBuilder(Fish, "f")
            .select([
                "f.fish_id",
                "f.name",
                "f.image",
                "f.rarity",
                raw(`(ABS(RANDOM()) % (f.max_weight - f.min_weight) + f.min_weight)`).as("weight"),
                "f.points_per_gramm",
                "f.reel_time_factor",
            ])
            .where(where)
            .orderBy({ [raw(`(ABS(RANDOM() / CAST(-9223372036854775808 AS REAL)) * f.rarity)`)]: "DESC" });
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
