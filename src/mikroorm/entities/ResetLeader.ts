import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { ResetRoster } from "./ResetRoster";

@Entity({ tableName: "reset_leaders" })
export class ResetLeader {
    @PrimaryKey({ autoincrement: true })
    resetLeaderId?: number;

    @ManyToOne({
        entity: () => ResetRoster,
        fieldName: "reset_roster_id",
        onUpdateIntegrity: "cascade",
        onDelete: "cascade",
        nullable: false,
    })
    resetRosterId?: ResetRoster;

    @Property()
    map!: string;

    @Property()
    player!: string;

    @Property()
    visible!: boolean;
}
