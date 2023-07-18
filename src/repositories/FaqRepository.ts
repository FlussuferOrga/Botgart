import { AbstractDbRepository } from "./AbstractDbRepository.js";
import { Faq } from "../mikroorm/entities/Faq.js";

export class FaqRepository extends AbstractDbRepository {
    public async storeFAQ(user: string, guild: string, keys: string[], text: string): Promise<Faq> {
        const faq = await this.orm.em.create(Faq, {
            guild: guild,
            createdBy: user,
            text: text,
            keys: keys.map((value) => ({
                key: value,
            })),
        });
        await this.orm.em.getRepository(Faq).persistAndFlush(faq);

        return faq;
    }

    public async deleteFAQ(key: string, guild: string): Promise<boolean> {
        const qb = this.orm.em.createQueryBuilder(Faq);
        const deleteResult = await qb.delete().where({ guild: guild, keys: { key: key } });
        return deleteResult.affectedRows > 0;
    }

    public async getFAQ(key: string, guild: string): Promise<Faq | null> {
        const qb = this.orm.em.getRepository(Faq);
        return await qb.findOne({ guild: guild, keys: { key: key } });
    }

    public async getFAQs(guild: string): Promise<Faq[]> {
        const qb = this.orm.em.createQueryBuilder(Faq);
        return await qb.select(["id", "text", "keys"]).where({ guild: guild });
    }
}
