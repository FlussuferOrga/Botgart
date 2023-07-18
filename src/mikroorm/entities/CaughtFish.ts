import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Fish } from "./Fish.js";
import { DateTime } from "luxon";
import { LuxonDateTimeType } from "../types/LuxonDateTimeType.js";

@Entity({ tableName: "caught_fish" })
export class CaughtFish {
    @PrimaryKey({ autoincrement: true })
    caught_id!: number;

    @ManyToOne({ entity: () => Fish, fieldName: "fish_id", onDelete: "cascade", nullable: false })
    fish_id: Fish;

    @Property()
    weight!: number;

    @Property()
    user!: string;

    @Property({ type: LuxonDateTimeType, nullable: false, defaultRaw: "CURRENT_TIMESTAMP" })
    timestamp!: DateTime;
}
