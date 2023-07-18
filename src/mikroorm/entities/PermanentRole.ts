import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { LuxonDateTimeType } from "../types/LuxonDateTimeType.js";
import { DateTime } from "luxon";

@Entity({ tableName: "permanent_roles" })
export class PermanentRole {
    @PrimaryKey({ nullable: false, autoincrement: true })
    id?: number;

    @Property()
    guild!: string;

    @Property()
    user!: string;

    @Property()
    role!: string;

    @Property({ type: LuxonDateTimeType, nullable: true, defaultRaw: "CURRENT_TIMESTAMP" })
    created?: DateTime;
}
