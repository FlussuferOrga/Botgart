import { BaseEntity, Entity, PrimaryKey, PrimaryKeyType, Property } from "@mikro-orm/core";

@Entity({ tableName: "fish" })
//@Check({expression: "min_weight < max_weight"})
export class Fish extends BaseEntity<Fish, "fish_id"> {
    [PrimaryKeyType]?: number; // this is needed for proper type checks in `FilterQuery`

    @PrimaryKey({ autoincrement: false, nullable: true })
    fish_id?: number;

    @Property({ nullable: true })
    name?: string;

    @Property({ nullable: true })
    image?: string;

    @Property({ type: "float", default: 1, nullable: true })
    //@Check({expression: 'rarity BETWEEN 0.1 AND 2.0'})
    rarity?: number;

    @Property({ nullable: true })
    //@Check({expression: "min_weight > 0"})
    min_weight?: number;

    @Property({ nullable: true })
    max_weight?: number;

    @Property({ type: "float", default: 1, nullable: true })
    points_per_gramm?: number;

    @Property({ type: "float", default: 1, nullable: true })
    //@Check({expression: "reel_time_factor > 0"})
    reel_time_factor?: number;
}
