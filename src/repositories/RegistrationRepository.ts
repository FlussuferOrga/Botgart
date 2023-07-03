import discord from "discord.js";
import {logger} from "../util/Logging";
import {AbstractDbRepository} from "./AbstractDbRepository";

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
        return this.execute((db) =>
            db
                .prepare(
                    `
                        SELECT id,
                               user,
                               guild,
                               api_key,
                               gw2account,
                               current_world_id,
                               account_name,
                               created
                        FROM registrations
                        WHERE account_name = ?
                        ORDER BY created DESC
                    `
                )
                .get(accountName)
        );
    }

    /**
     * Same as getUserByAccountName, but this time, the Discord user ID
     * is used.
     * discordUser: the Discord user to retrieve the account for.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public getUserByDiscordId(discordUser: discord.User): Registration {
        return this.execute((db) =>
            db
                .prepare(
                    `
                        SELECT id,
                               user,
                               guild,
                               api_key,
                               gw2account,
                               current_world_id,
                               account_name,
                               created
                        FROM registrations
                        WHERE user = ?
                        ORDER BY created DESC
                    `
                )
                .get(discordUser.id)
        );
    }

    public whois(searchString: string, discordUserIds: string[]): { discord_id: string; account_name: string }[] {
        return this.execute((db) => {
            db.prepare("CREATE TEMP TABLE IF NOT EXISTS whois(discord_id TEXT)").run();
            const stmt = db.prepare(`INSERT INTO whois(discord_id)
                                     VALUES (?)`);
            discordUserIds.forEach((id) => stmt.run(id));

            return db
                .prepare(
                    `
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
                    `
                )
                .all(searchString.toLowerCase());
        });
    }

    public getDesignatedRoles(): DesignatedWorlds[] {
        return this.execute((db) =>
            db
                .prepare(
                    `SELECT user, guild, current_world_id
                     FROM registrations
                     ORDER BY guild`
                )
                .all()
        );
    }

    public storeAPIKey(
        user: string,
        guild: string,
        key: string,
        gw2account: string,
        accountName: string,
        currentWorldId: number
    ): boolean | undefined {
        const sql = `INSERT INTO registrations(user, guild, api_key, gw2account, account_name, current_world_id)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return this.execute((db) => {
            db.prepare(sql).run(user, guild, key, gw2account, accountName, currentWorldId);
            return true;
        });
    }

    public loadRegistrationsFromDb(): Registration[] {
        LOG.info("Loading all registrations from DB.");
        const execute = this.execute((db) =>
            db
                .prepare(
                    `SELECT id, api_key, gw2account, guild, user, current_world_id, account_name
                     FROM registrations
                     ORDER BY id`
                )
                .all()
        );
        LOG.info(`Loaded ${execute.length} from DB.`);

        return execute;
    }

    public loadUserIds(guildId: string): string[] {
        LOG.info(`Loading all user ids for guild ${guildId}`);
        const execute = this.execute((db) =>
            db
                .prepare(
                    `SELECT user
                     FROM registrations
                     WHERE guild = ?
                     ORDER BY user`
                )
                .all(guildId)
        );
        LOG.info(`Loaded ${execute.length} user ids from DB.`);

        return execute.map((value) => value.user);
    }

    public deleteKey(key: string): boolean | undefined {
        return this.execute((db) => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(
                    `DELETE
                     FROM registrations
                     WHERE api_key = ?`
                ).run(key);
                changes = db.prepare("SELECT changes() AS changes").get().changes;
            })(null);
            return changes > 0;
        });
    }

    public findDuplicateRegistrations() {
        return this.execute((db) =>
            db
                .prepare(
                    `SELECT group_concat(user, ',') AS users, COUNT(*) AS count, gw2account
                     FROM registrations
                     GROUP BY gw2account
                     HAVING count > 1`
                )
                .all()
        ).map((value) => ({
            userIds: value.users.split(","),
            count: value.count,
            gw2account: value.gw2account,
        }));
    }

    public updateRegistration(id: string, currentWorldId: number, accountName: string, gw2accountId: string) {
        this.execute((db) => {
            db.prepare(
                `UPDATE registrations
                 SET current_world_id = ?,
                     account_name     = ?,
                     gw2account       = ?
                 WHERE id = ?`
            ).run(currentWorldId, accountName, gw2accountId, id);
        });
    }
}

export interface Registration {
    readonly id: string;
    readonly user: string;
    readonly guild: string;
    readonly api_key: string;
    readonly gw2account: string;
    readonly current_world_id: number;
    readonly account_name: string;
    readonly created: string;
}

export interface DesignatedWorlds {
    readonly user: string;
    readonly guild: string;
    readonly current_world_id: number;
}
