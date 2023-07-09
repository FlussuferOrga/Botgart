import { Collection, Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { ResetLeader } from "./ResetLeader";

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
}
