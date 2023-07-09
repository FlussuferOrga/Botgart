import { Entity, PrimaryKey, PrimaryKeyType, Property } from "@mikro-orm/core";
import { MomentType } from "../types/Moment";
import moment from "moment-timezone";

export enum PermissionType {
    user = "user",
    role = "role",
    other = "other",
}

@Entity({ tableName: "command_permissions" })
export class CommandPermission {
    [PrimaryKeyType]?: number;

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

    @Property({ type: MomentType, nullable: false, defaultRaw: "CURRENT_TIMESTAMP" })
    timestamp!: moment.Moment;
}
