import { Entity, PrimaryKey, PrimaryKeyProp, Property } from "@mikro-orm/core";
import { LuxonDateTimeType } from "../types/LuxonDateTimeType.js";
import { DateTime } from "luxon";

export enum PermissionType {
    user = "user",
    role = "role",
    other = "other",
}

@Entity({ tableName: "command_permissions" })
export class CommandPermission {
    [PrimaryKeyProp]?: number;

    @PrimaryKey({ nullable: false, autoincrement: true })
    commandPermissionsId?: number;

    @Property()
    command!: string;

    @Property()
    receiver!: string;

    @Property()
    type!: PermissionType;

    @Property()
    guild!: string;

    @Property()
    value!: number;

    @Property({ type: LuxonDateTimeType, nullable: false, defaultRaw: "CURRENT_TIMESTAMP" })
    timestamp!: DateTime;
}
