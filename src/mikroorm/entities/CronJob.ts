import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { LuxonDateTimeType } from "../types/LuxonDateTimeType.js";
import { DateTime } from "luxon";

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

    @Property({ type: LuxonDateTimeType, nullable: true, defaultRaw: "CURRENT_TIMESTAMP" })
    created?: DateTime;
}
