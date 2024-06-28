import { PromisePool } from "@supercharge/promise-pool";
import { Semaphore } from "await-semaphore";
import Timeout from "await-timeout";
import discord from "discord.js";
import { BotgartClient } from "../BotgartClient.js";
import { AccountData, getAccountInfo, InvalidKeyError } from "../Gw2ApiUtils.js";
import * as L from "../Locale.js";
import { logger } from "../util/Logging.js";
import { formatUserPing } from "../util/Util.js";
import { Registration } from "../mikroorm/entities/Registration.js";

const LOG = logger();

export type CheckResult = undefined | false | AccountData;

export class RevalidationService {
    private static REAUTH_DELAY = 1000;
    private static REAUTH_MAX_PARALLEL_REQUESTS = 3;

    private static SEM = new Semaphore(RevalidationService.REAUTH_MAX_PARALLEL_REQUESTS);

    private client: BotgartClient;

    constructor(client: BotgartClient) {
        this.client = client;
    }

    /**
     * Revalidates all keys that have been put into the database. Note that due to rate limiting, this method implements some
     * politeness mechanisms and will take quite some time!
     * @returns {[ undefined | ( {api_key, guild, user, registration_role}, admittedRole|null ) ]} - a list of tuples, where each tuple holds a user row from the db
     *           and the name of the role that user should have. Rows can be undefined if an error was encountered upon validation!
     */
    public async revalidateKeys() {
        //TODO: Scroll instead of full-load
        const allRegistrations = await this.client.registrationRepository.loadRegistrationsFromDb();
        await PromisePool.withConcurrency(1)
            .for(allRegistrations)
            .handleError(async (error, user) => {
                LOG.error(`Error during validation of ${user.account_name}: ${error}`);
            })
            .process(async (reg) => {
                const result = await this.checkRegistration(reg);
                if (result !== undefined) {
                    await this.handle(reg, result);
                } else {
                    LOG.error("API validation yielded undefined for the entire result of revalidations. Critical error!");
                }
                await Timeout.set(RevalidationService.REAUTH_DELAY);
            });
    }

    private async checkRegistration(r: Registration): Promise<CheckResult> {
        const release = await RevalidationService.SEM.acquire();
        LOG.info(`Sending revalidation request for API key ${r.api_key}.`);
        try {
            return await getAccountInfo(r.api_key);
        } catch (e) {
            if (e instanceof InvalidKeyError) {
                // while this was an actual error when initially registering (=> tell user their key is invalid),
                // in the context of revalidation this is actually a valid case: the user must have given a valid key
                // upon registration (or else it would not have ended up in the DB) and has now deleted the key
                // => remove the validation role from the user
                return false;
            } else {
                LOG.error(`Error occurred while revalidating key ${r.api_key}. User will be except from this revalidation.\n${e}`);
                return undefined;
            }
        } finally {
            release();
        }
    }

    private static readonly LOG_TYPE_DEAUTHORIZE: string = "unauth";

    private async handle(registration: Registration, authResult: CheckResult) {
        const guild: discord.Guild | null = await this.client.guilds.fetch(registration.guild);

        // filter out users for which we encountered errors
        if (!guild) {
            LOG.error(`Could not find a guild ${registration.guild}. Have I been kicked?`);
        } else {
            const member: discord.GuildMember | undefined = await guild.members.fetch(registration.user).catch((ex) => {
                LOG.error(`Could not retrieve user ${registration.user}: ${ex.message}`);
                return undefined;
            });
            if (!member) {
                LOG.info(`${registration.user} is no longer part of the discord guild. Deleting their key.`);
                await this.client.discordLog(
                    guild,
                    RevalidationService.LOG_TYPE_DEAUTHORIZE,
                    L.get("DLOG_UNAUTH", [formatUserPing(registration.user), registration.account_name])
                );
                await this.client.registrationRepository.delete(registration);
                return;
            }
            if (authResult == false) {
                // user should be pruned: user has either transed (false) or deleted their key (invalid key)
                LOG.info("Unauthorize {0}.".formatUnicorn(member.user.username));
                await this.client.validationService.synchronizeDiscordRoles(member, null, "Api Key invalid");
                await this.client.registrationRepository.deleteById(registration);
                await this.client.discordLog(
                    guild,
                    RevalidationService.LOG_TYPE_DEAUTHORIZE,
                    L.get("DLOG_UNAUTH", [formatUserPing(registration.user), registration.account_name])
                );
                await member.send(L.get("KEY_INVALIDATED"));
            } else if (authResult != undefined) {
                const updatedRegistration = await this.updateDatabaseIfRequired(registration, authResult);
                await this.client.validationService.synchronizeDiscordRoles(member, updatedRegistration, "ReAuthentication");
            }
        }
    }

    private async updateDatabaseIfRequired(registration: Registration, accountData: AccountData) {
        const outdated =
            registration.account_name != accountData.name ||
            registration.gw2account != accountData.id ||
            registration.current_world_id != accountData.world ||
            registration.gw2GuildIds != accountData.guilds;
        if (outdated) {
            const old = {
                account_name: registration.account_name,
                gw2account: registration.gw2account,
                current_world_id: registration.current_world_id,
                guildIds: registration.gw2GuildIds,
            };
            registration = await this.client.registrationRepository.updateRegistration(
                registration,
                accountData.world,
                accountData.name,
                accountData.id,
                accountData.guilds
            );
            if (LOG.isInfoEnabled()) {
                LOG.info(`Account Data updated for ${registration.user}`, {
                    old: old,
                    new: {
                        account_name: registration.account_name,
                        gw2account: registration.gw2account,
                        current_world_id: registration.current_world_id,
                        guildIds: registration.gw2GuildIds,
                    },
                });
            }
        }
        return registration;
    }
}
