import discord from "discord.js";
import { logger } from "../Logging";
import { AbstractDbRepository } from "./AbstractDbRepository";


const LOG = logger();

export class RegistrationRepository extends AbstractDbRepository {
    /**
     * Gets a user by their account name. That is Foobar.1234.
     * Having multiple users registered with the same GW2 account will
     * only retrieve the one that was created last.
     * accountName: GW2 account name.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public getUserByAccountName(accountName: string): Registration | undefined {
        return this.execute(db => db.prepare(`
            SELECT id,
                   user,
                   guild,
                   api_key,
                   gw2account,
                   registration_role,
                   account_name,
                   created
            FROM registrations
            WHERE account_name = ?
            ORDER BY created DESC
        `).get(accountName));
    }

    /**
     * Same as getUserByAccountName, but this time, the unique account ID
     * is used. That's the one looking like FFFF-FFFF-FFFF-FFFF.
     * accountName: GW2 account name.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public getUserByGW2Account(gw2account: string): Registration {
        return this.execute(db => db.prepare(`
            SELECT id,
                   user,
                   guild,
                   api_key,
                   gw2account,
                   registration_role,
                   account_name,
                   created
            FROM registrations
            WHERE gw2account = ?
            ORDER BY created DESC
        `).get(gw2account));
    }

    /**
     * Same as getUserByAccountName, but this time, the Discord user ID
     * is used.
     * discordUser: the Discord user to retrieve the account for.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public getUserByDiscordId(discordUser: discord.User): Registration {
        return this.execute(db => db.prepare(`
            SELECT id,
                   user,
                   guild,
                   api_key,
                   gw2account,
                   registration_role,
                   account_name,
                   created
            FROM registrations
            WHERE user = ?
            ORDER BY created DESC
        `).get(discordUser.id));
    }

    public whois(searchString: string, discordUserIds: string[]): { discord_id: string; account_name: string }[] {
        return this.execute(db => {
            db.prepare(`CREATE TEMP TABLE IF NOT EXISTS whois(discord_id TEXT)`).run();
            const stmt = db.prepare(`INSERT INTO whois(discord_id)
                                     VALUES (?)`);
            discordUserIds.forEach(id => stmt.run(id));

            return db.prepare(`
                SELECT whois.discord_id AS discord_id,
                       reg.account_name AS account_name
                FROM whois AS whois
                         LEFT JOIN registrations AS reg
                                   ON whois.discord_id = reg.user
                UNION
                SELECT user         AS discord_id,
                       account_name AS account_name
                FROM registrations
                WHERE LOWER(account_name) LIKE ('%' || ? || '%')
            `).all(searchString.toLowerCase());
        });
    }

    public getGW2Accounts(accnames: [string]): [object] {
        return this.execute(db => db.prepare(`SELECT id, user, guild, api_key, gw2account, registration_role, created
                                              FROM registrations
                                              WHERE gw2account IN (?)`)
            .run(accnames.join(",")).all());
    }

    public getDesignatedRoles(): DesignatedRole[] {
        return this.execute(db => db.prepare(`SELECT user, guild, registration_role
                                              FROM registrations
                                              ORDER BY guild`).all());
    }

    public storeAPIKey(user: string, guild: string, key: string, gw2account: string, accountName: string, role: string): boolean | undefined {
        let sql = `INSERT INTO registrations(user, guild, api_key, gw2account, account_name, registration_role)
                   VALUES (?, ?, ?, ?, ?, ?)`;
        return this.execute(db => {
            try {
                db.prepare(sql).run(user, guild, key, gw2account, accountName, role);
                return true;
            } catch (err) {
                LOG.error("Error while trying to store API key: {0}.".formatUnicorn(err.message))
                return false;
            }
        });
    }

    public loadRegistrationsFromDb(): Registration[] {
        LOG.info(`Loading all registrations from DB.`)
        const execute = this.execute(db => {
            return db.prepare(`SELECT id, api_key, guild, user, registration_role, account_name
                               FROM registrations
                               ORDER BY guild`).all()
        });
        LOG.info(`Loaded ${execute.length} from DB.`)

        return execute;
    }

    public loadUserIds(guildId: string): string[] {
        LOG.info(`Loading all user ids for guild ${guildId}`)
        const execute = this.execute(db => {
            return db.prepare(`SELECT user
                               FROM registrations
                               WHERE guild = ?
                               ORDER BY user`).all(guildId)
        });
        LOG.info(`Loaded ${execute.length} user ids from DB.`)

        return execute.map(value => value.user);
    }

    public deleteKey(key: string): boolean | undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE
                            FROM registrations
                            WHERE api_key = ?`).run(key)
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null);
            return changes > 0;
        });
    }

    public findDuplicateRegistrations(): any {
        return this.execute(db => db.prepare(`SELECT group_concat(user, ',') AS users, COUNT(*) AS count, gw2account
                                              FROM registrations
                                              GROUP BY gw2account
                                              HAVING count > 1`).all());
    }

    public setRegistrationRoleById(id: string, roleName: string) {
        this.execute(db => {
            db.prepare(`UPDATE registrations
                        SET registration_role = ?
                        WHERE id = ?`)
                .run(roleName, id)
        })
    }
}

export interface Registration {
    readonly id: string;
    readonly user: string;
    readonly guild: string,
    readonly api_key: string,
    readonly gw2account: string,
    readonly registration_role: string,
    readonly account_name: string,
    readonly created: string
}

export interface DesignatedRole {
    readonly user: string;
    readonly guild: string;
    readonly registration_role: string;
}