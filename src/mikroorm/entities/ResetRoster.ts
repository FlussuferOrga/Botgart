import { Collection, Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { ResetLeader } from "./ResetLeader";

@Entity({ tableName: "reset_rosters" })
export class ResetRoster {
    @PrimaryKey({ nullable: false, autoincrement: true })
    resetRosterId?: number;

    @Property()
    weekNumber!: number;

    @Property()
    year!: number;

    @Property()
    guild!: string;

    @Property()
    channel!: string;

    @Property()
    message!: string;

    @OneToMany(() => ResetLeader, (e) => e.resetRosterId, { orphanRemoval: true })
    leaders = new Collection<ResetLeader>(this);
}
