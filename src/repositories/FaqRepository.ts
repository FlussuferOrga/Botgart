import { AbstractDbRepository } from "./AbstractDbRepository";

export type Faq = {
    key: string;
    text: string,
}

export class FaqRepository extends AbstractDbRepository {

    public storeFAQ(user: string, guild: string, keys: [string], text: string): number | undefined {
        return this.execute(db => {
            let lastId = undefined;
            db.transaction((_) => {
                db.prepare(`INSERT INTO faqs(created_by, guild, text)
                            VALUES (?, ?, ?)`).run(user, guild, text);
                lastId = db.prepare("SELECT last_insert_rowid() AS id").get().id;
                const stmt = db.prepare(`INSERT INTO faq_keys(created_by, guild, key, faq_id)
                                         VALUES (?, ?, ?, ?)`);
                keys.forEach(k => stmt.run(user, guild, k, lastId));
            })(null);
            return lastId;
        });
    }

    public deleteFAQ(key: string, guild: string): boolean | undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE
                            FROM faq_keys
                            WHERE key = ?
                              AND guild = ?`).run(key, guild);
                changes = db.prepare("SELECT changes() AS changes").get().changes;
                db.prepare(`DELETE
                            FROM faqs
                            WHERE id IN (SELECT f.id
                                         FROM faqs AS f
                                                  LEFT JOIN faq_keys AS fk ON f.id = fk.faq_id
                                         WHERE key IS NULL)`).run();
            })(null);
            return changes > 0;
        });
    }

    public getFAQ(key: string, guild: string): Faq {
        return this.execute(db => db.prepare(`SELECT *
                                              FROM faqs AS f
                                                       JOIN faq_keys AS fk ON f.id = fk.faq_id
                                              WHERE fk.key = ?
                                                AND fk.guild = ?`).get(key, guild));
    }

    public getFAQs(guild: string): Faq[] {
        return this.execute(db => db.prepare(`SELECT *
                                              FROM faqs AS f
                                                       JOIN faq_keys AS fk ON f.id = fk.faq_id
                                              WHERE fk.guild = ?`).all(guild));
    }
}