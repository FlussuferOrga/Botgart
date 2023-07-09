import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { MomentType } from "../types/Moment";
import moment from "moment-timezone";

@Entity({ tableName: "cronjobs" })
export class CronJob {
    @PrimaryKey({ nullable: false, autoincrement: true })
    id?: number;

    @Property()
    schedule!: string;

    @Property()
    command!: string;

    @Property({ nullable: true })
    arguments?: string;

    @Property()
    createdBy!: string;

    @Property()
    guild!: string;

    @Property({ type: MomentType, nullable: true, defaultRaw: "CURRENT_TIMESTAMP" })
    created?: moment.Moment;
}
