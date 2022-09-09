import PromisePool from "@supercharge/promise-pool";
import { Semaphore } from "await-semaphore";
import Timeout from "await-timeout";
import discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { getConfig, WorldAssignment } from "../config/Config";
import * as Gw2ApiUtils from "../Gw2ApiUtils";
import { AccountData, getAccountInfo, InvalidKeyError } from "../Gw2ApiUtils";
import * as L from "../Locale";
import { Registration } from "../repositories/RegistrationRepository";
import { logger } from "../util/Logging";
import { formatUserPing } from "../util/Util";


const LOG = logger();

export type CheckResult =
    { valid: false }
    |
    {
        roleName: string;
        accountData: AccountData;
        valid: true;
    };

export class RevalidationService {
    private static REAUTH_DELAY = 8000;
    private static REAUTH_MAX_PARALLEL_REQUESTS = 3;


    private static SEM = new Semaphore(RevalidationService.REAUTH_MAX_PARALLEL_REQUESTS);

    private client: BotgartClient;

    constructor(client: BotgartClient) {
        this.client = client;
        this.worldAssignments = getConfig().get().world_assignments;
    }

    private readonly worldAssignments: { world_id: number; role: string }[];

    /**
     * Revalidates all keys that have been put into the database. Note that due to rate limiting, this method implements some
     * politeness mechanisms and will take quite some time!
     * @returns {[ undefined | ( {api_key, guild, user, registration_role}, admittedRole|null ) ]} - a list of tuples, where each tuple holds a user row from the db
     *           and the name of the role that user should have. Rows can be undefined if an error was encountered upon validation!
     */
    public async revalidateKeys() {
        const allRegistrations = this.client.registrationRepository.loadRegistrationsFromDb();
        await PromisePool.withConcurrency(1)
            .for(allRegistrations)
            .handleError(async (error, user) => {
                LOG.error(`Error during validation of ${user.account_name}: ${error}`);
            })
            .process(async reg => {
                const result = await this.checkRegistration(this.worldAssignments, reg);
                if (result !== undefined) {
                    await this.handle(reg, result);
                } else {
                    LOG.error("API validation yielded undefined for the entire result of revalidations. Critical error!");
                }
                await Timeout.set(RevalidationService.REAUTH_DELAY);
            });
    }


    private async checkRegistration(worldAssignments: WorldAssignment[],
                                    r: Registration): Promise<undefined | CheckResult> {
        const release = await RevalidationService.SEM.acquire();
        LOG.info(`Sending revalidation request for API key ${r.api_key}.`);
        try {
            const accountData = await getAccountInfo(r.api_key);
            const validationResult = await Gw2ApiUtils.validateWorld(accountData, worldAssignments);

            if (validationResult !== false) {
                return { roleName: validationResult.role, accountData: accountData, valid: true };
            } else {
                return { valid: false };
            }
        } catch (e) {
            if (e instanceof InvalidKeyError) {
                // while this was an actual error when initially registering (=> tell user their key is invalid),
                // in the context of revalidation this is actually a valid case: the user must have given a valid key
                // upon registration (or else it would not have ended up in the DB) and has now deleted the key
                // => remove the validation role from the user
                return { valid: false };
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
            const member: discord.GuildMember | undefined = await guild.members.fetch(registration.user)
                .catch(ex => {
                    LOG.error(`Could not retrieve user ${registration.user}: ${ex.message}`);
                    return undefined;
                });
            const registeredWithRole = registration.registration_role;
            if (!member) {
                LOG.info(`${registration.user} is no longer part of the discord guild. Deleting their key.`);
                this.client.discordLog(guild, RevalidationService.LOG_TYPE_DEAUTHORIZE, L.get("DLOG_UNAUTH", [formatUserPing(registration.user), registration.account_name, registeredWithRole]));
                this.client.registrationRepository.deleteKey(registration.api_key);
                return;
            }
            if (!authResult.valid) {
                // user should be pruned: user has either transed (false) or deleted their key (invalid key)
                LOG.info("Unauthing {0}.".formatUnicorn(member.user.username));
                await this.client.validationService.setMemberRolesByString(member, [], "Api Key invalid or not authorized Server");
                this.client.registrationRepository.deleteKey(registration.api_key);
                this.client.discordLog(guild, RevalidationService.LOG_TYPE_DEAUTHORIZE, L.get("DLOG_UNAUTH", [formatUserPing(registration.user), registration.account_name, registeredWithRole]));
                await member.send(L.get("KEY_INVALIDATED"));
            } else if (authResult.valid) {
                this.updateDatabaseIfRequired(registration, authResult.accountData, authResult.roleName);
                const admittedRole: discord.Role | undefined = guild.roles.cache.find(r => r.name === authResult.roleName);
                if (!admittedRole) { // false -> no role should be assigned assigned at all
                    LOG.error(`Can not find the role "${(authResult.roleName)}" that should be currently used.`);
                    throw new Error(`Can not find the role "${registeredWithRole}" that should be currently used.`);
                } else {
                    // user transferred to another admitted server -> update role
                    // log("info", `Changing role of user ${member.displayName} from ${currentRole} to ${admittedRole} (unless they are the same).`);
                    await this.client.validationService.setMemberRolesByString(member, [admittedRole.name], "ReAuthentication");
                    // assignServerRole(member, currentRole, admittedRole === undefined ? null : admittedRole);
                }
            }
        }
    }

    private updateDatabaseIfRequired(registration: Registration, accountData: AccountData, roleName: string) {
        const outdated = registration.account_name != accountData.name
            || registration.gw2account != accountData.id
            || registration.registration_role != roleName;
        if (outdated) {
            this.client.registrationRepository.updateRegistration(registration.id, roleName, accountData.name, accountData.id);
            if (LOG.isInfoEnabled()) {
                LOG.info(`Account Data updated for ${registration.id}`,
                    {
                        old: {
                            account_name: registration.account_name,
                            gw2account: registration.gw2account,
                            registration_role: registration.registration_role
                        },
                        new: {
                            account_name: accountData.name,
                            gw2account: accountData.id,
                            registration_role: roleName
                        }
                    });
            }
        }
    }
}