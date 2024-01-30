import { Entity, ManyToOne, PrimaryKey, Property, Rel } from "@mikro-orm/core";
import { ResetRoster } from "./ResetRoster.js";

@Entity({ tableName: "reset_leaders" })
export class ResetLeader {
    @PrimaryKey({ autoincrement: true })
    resetLeaderId?: number;

    @ManyToOne({
        entity: () => ResetRoster,
        fieldName: "reset_roster_id",
        updateRule: "cascade",
        deleteRule: "cascade",
        nullable: false,
    })
    resetRosterId?: Rel<ResetRoster>;

    @Property()
    map!: string;

    @Property()
    player!: string;

    @Property()
    visible!: boolean;
}
