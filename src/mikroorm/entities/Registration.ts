import { Entity, Index, PrimaryKey, Property, Unique } from "@mikro-orm/core";
import moment from "moment-timezone";
import { MomentType } from "../types/Moment";

@Entity({ tableName: "registrations" })
@Unique({ properties: ["guild", "api_key"] })
//@Unique({ properties: ["guild", "gw2account"] })
export class Registration {
    @PrimaryKey()
    guild!: string;

    @PrimaryKey()
    user!: string;

    @Property()
    api_key!: string;

    @Property()
    gw2account!: string;

    @Property()
    current_world_id: number;

    // only for whois checks
    @Property()
    account_name: string;

    @Property({ type: MomentType, nullable: true, defaultRaw: "CURRENT_TIMESTAMP" })
    created?: moment.Moment;
}
