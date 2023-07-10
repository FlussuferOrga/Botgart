import { Collection, Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { ResetLeader } from "./ResetLeader";
import {MomentType} from "../types/Moment";
import moment from "moment-timezone";

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

    @Property({ type: MomentType, nullable: true, defaultRaw: "CURRENT_TIMESTAMP" })
    created?: moment.Moment;
}
