import { Collection, Entity, Index, ManyToOne, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { MomentType } from "../types/Moment";
import moment from "moment-timezone";

@Entity({ tableName: "faqs" })
export class Faq {
    @PrimaryKey({ autoincrement: true })
    id?: number;

    @Property()
    text!: string;

    @Property()
    createdBy!: string;

    @Property()
    guild!: string;

    @OneToMany(() => FaqKey, (faqKey) => faqKey.faqId)
    keys = new Collection<FaqKey>(this);

    @Property({ type: MomentType, nullable: true, defaultRaw: "CURRENT_TIMESTAMP" })
    created?: moment.Moment;
}

@Entity({ tableName: "faq_keys" })
export class FaqKey {
    @PrimaryKey({ autoincrement: true })
    id?: number;

    @Index({ name: "index_faq_keys_key" })
    @Property()
    key!: string;

    @ManyToOne({
        entity: () => Faq,
        fieldName: "faq_id",
        onUpdateIntegrity: "cascade",
        onDelete: "cascade",
        nullable: false,
    })
    faqId!: Faq;
}
