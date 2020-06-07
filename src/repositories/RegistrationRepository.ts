import { Semaphore } from "await-semaphore";
import Timeout from "await-timeout";
import discord from "discord.js";
import { getConfig } from "../config/Config";
import * as Gw2ApiUtils from "../Gw2ApiUtils";
import * as Util from "../Util";
import { AbstractDbRepository } from "./AbstractDbRepository";

const REAUTH_DELAY: number = 10000;
const REAUTH_MAX_PARALLEL_REQUESTS: number = 2;

export class RegistrationRepository extends AbstractDbRepository {
    /**
     * Gets a user by their account name. That is Foobar.1234.
     * Having multiple users registered with the same GW2 account will
     * only retrieve the one that was created last.
     * accountName: GW2 account name.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public getUserByAccountName(accountName: string): Registration {
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

    public whois(searchString: string, discordCandidates: discord.User[]): { "discord_user": string, "account_name": string }[] {
        return this.execute(db => {
            db.prepare(`CREATE TEMP TABLE IF NOT EXISTS whois(discord_id TEXT)`).run();
            const stmt = db.prepare(`INSERT INTO whois(discord_id)
                                     VALUES (?)`);
            discordCandidates.forEach(dc => stmt.run(dc.id));
            return db.prepare(`
                SELECT user         AS discord_user,
                       account_name AS account_name
                FROM registrations AS r
                         JOIN whois AS w
                              ON w.discord_id = r.user
                UNION
                SELECT user         AS discord_user,
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
                Util.log("error", "Error while trying to store API key: {0}.".formatUnicorn(err.message));
                return false;
            }
        });
    }

    /**
     * Revalidates all keys that have been put into the database. Note that due to rate limiting, this method implements some
     * politeness mechanisms and will take quite some time!
     * @returns {[ undefined | ( {api_key, guild, user, registration_role}, admittedRole|null ) ]} - a list of tuples, where each tuple holds a user row from the db
     *           and the name of the role that user should have. Rows can be undefined if an error was encountered upon validation!
     */
    public async revalidateKeys(): Promise<any> {
        let semaphore = new Semaphore(REAUTH_MAX_PARALLEL_REQUESTS);

        const worldAssignments = getConfig().get().world_assignments;
        return this.execute(db =>
            Promise.all(
                db.prepare(`SELECT api_key, guild, user, registration_role, account_name
                            FROM registrations
                            ORDER BY guild`).all()
                    .map(async r => {
                        let release = await semaphore.acquire();

                        let res = await Gw2ApiUtils.validateWorld(r.api_key, worldAssignments).then(
                            admittedRole => [r, admittedRole],
                            error => {
                                if (error === Gw2ApiUtils.validateWorld.ERRORS.invalid_key) {
                                    // while this was an actual error when initially registering (=> tell user their key is invalid),
                                    // in the context of revalidation this is actually a valid case: the user must have given a valid key
                                    // upon registration (or else it would not have ended up in the DB) and has now deleted the key
                                    // => remove the validation role from the user
                                    return [r, false];
                                } else {
                                    Util.log("error", "Error occured while revalidating key {0}. User will be excempt from this revalidation.".formatUnicorn(r.api_key));
                                    return undefined;
                                }
                            }
                        );
                        await Timeout.set(REAUTH_DELAY);
                        release();
                        return res;
                    })
            )
        );
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