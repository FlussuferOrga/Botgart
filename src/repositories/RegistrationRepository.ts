import discord from "discord.js";
import { logger } from "../util/Logging.js";
import { AbstractDbRepository } from "./AbstractDbRepository.js";
import { Registration } from "../mikroorm/entities/Registration.js";
import { expr } from "@mikro-orm/core";
import { uniq } from "lodash-es";

const LOG = logger();

export class RegistrationRepository extends AbstractDbRepository {
    /**
     * Gets a user by their account name. That is Foobar.1234.
     * Having multiple users registered with the same GW2 account will
     * only retrieve the one that was created last.
     * accountName: GW2 account name.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public async getUserByAccountName(accountName: string): Promise<Registration | null> {
        return await this.orm.em.getRepository(Registration).findOne({ account_name: accountName });
    }

    /**
     * Same as getUserByAccountName, but this time, the Discord user ID
     * is used.
     * discordUser: the Discord user to retrieve the account for.
     * returns: the latest entry for that account name if any, else undefined.
     */
    public async getUserByDiscordId(discordUser: discord.User): Promise<Registration | null> {
        return await this.orm.em.getRepository(Registration).findOne({ user: discordUser.id });
    }

    public async whois(
        searchString: string,
        guildId: string,
        discordUserIds: string[]
    ): Promise<
        {
            user: string;
            account_name?: string;
        }[]
    > {
        return uniq([
            ...(await this.orm.em.find(
                Registration,
                {
                    guild: guildId,
                    user: { $in: discordUserIds },
                },
                { fields: ["account_name", "user"] }
            )),
            ...(await this.orm.em.find(
                Registration,
                {
                    guild: guildId,
                    [expr("lower(account_name)")]: { $like: `%${searchString.toLowerCase()}%` },
                },
                { fields: ["account_name", "user"] }
            )),
            ...discordUserIds.map((value) => {
                return { user: value };
            }),
        ]);
    }

    public async getDesignatedRoles(guildId): Promise<DesignatedWorlds[]> {
        return await this.orm.em.getRepository(Registration).find({ guild: guildId }, { fields: ["user", "current_world_id"] });
    }

    public async storeAPIKey(
        user: string,
        guild: string,
        key: string,
        gw2account: string,
        accountName: string,
        currentWorldId: number
    ): Promise<Registration> {
        return await this.orm.em.upsert(Registration, {
            guild: guild,
            user: user,
            api_key: key,
            gw2account: gw2account,
            account_name: accountName,
            current_world_id: currentWorldId,
        });
    }

    public async loadRegistrationsFromDb(): Promise<Registration[]> {
        LOG.info("Loading all registrations from DB.");
        return await this.orm.em.getRepository(Registration).findAll();
    }

    public async loadUserIds(guildId: string): Promise<string[]> {
        LOG.info(`Loading all user ids for guild ${guildId}`);
        const result = await this.orm.em.getRepository(Registration).find({ guild: guildId }, { fields: ["user"] });
        return result.map((d) => d.user);
    }

    public async findDuplicateRegistrations(guild: string) {
        const knex = this.orm.em.getKnex();
        const result = await knex
            .queryBuilder()
            .select(["gw2account", knex.raw("group_concat(account_name, ',') as account_names"), knex.raw("group_concat(user, ',') as users")])
            .count("* as count")
            .from("registrations")
            .where({ guild: guild })
            .groupBy("gw2account")
            .having("count", ">", 1);
        return result.map((value) => {
            return {
                users: value.users.split(","),
                count: value.count,
                gw2account: value.gw2account,
                account_names: uniq(value.account_names.split(",")),
            };
        });
    }

    public async updateRegistration(registration: Registration, currentWorldId: number, accountName: string, gw2accountId: string) {
        const entity = this.orm.em.assign(registration, {
            current_world_id: currentWorldId,
            account_name: accountName,
            gw2account: gw2accountId,
        });
        await this.orm.em.flush();
        return entity;
    }

    public async delete(registration: Registration) {
        await this.orm.em.removeAndFlush(registration);
    }
}

export interface DesignatedWorlds {
    readonly user: string;
    readonly current_world_id: number;
}
