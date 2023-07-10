import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import moment from "moment-timezone";
import { MomentType } from "../types/Moment";
import { Fish } from "./Fish";

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

    @Property({ type: MomentType, nullable: false, defaultRaw: "CURRENT_TIMESTAMP" })
    timestamp!: moment.Moment;
}
