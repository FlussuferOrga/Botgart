import PromisePool from "@supercharge/promise-pool";
import { Semaphore } from "await-semaphore/index";
import Timeout from "await-timeout";
import discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import * as Gw2ApiUtils from "../Gw2ApiUtils";
import * as L from "../Locale";
import { Registration } from "../repositories/RegistrationRepository";
import { logger } from "../util/Logging";
import { formatUserPing } from "../util/Util";


const LOG = logger();

export class RevalidationService {
    private static REAUTH_DELAY = 8000;
    private static REAUTH_MAX_PARALLEL_REQUESTS = 3;


    private static SEM = new Semaphore(RevalidationService.REAUTH_MAX_PARALLEL_REQUESTS);

    private client: BotgartClient;

    constructor(client: BotgartClient) {
        this.client = client;
        this.worldAssignments = getConfig().get().world_assignments;
    }

    private readonly worldAssignments: { world_id: number; role: string; }[];

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
            });
    }


    private async checkRegistration(worldAssignments: { world_id: number; role: string }[],
                                    r: Registration): Promise<undefined | { roleName?: string, valid: boolean }> {
        const release = await RevalidationService.SEM.acquire();
        LOG.info(`Sending revalidation request for API key ${r.api_key}.`);
        const res: (string | boolean) | undefined = await Gw2ApiUtils.validateWorld(r.api_key, worldAssignments)
            .then(
                // this ternary hack is required to work around the typing of the Promise from validateWorld
                // which returns a number upon rejecting and string | boolean in case of success.
                // So we can never end up with a number in success! But since we can not have distinct typing for both cases,
                // the type is always number | string | boolean. The ternary casts all numbers (which never occur) to string
                // so that the type is consistent from here on.
                (admittedRole): (string | boolean) => typeof admittedRole === "boolean" ? admittedRole : "" + admittedRole,
                (error): undefined | false => {
                    if (error === Gw2ApiUtils.validateWorld.ERRORS.invalid_key) {
                        // while this was an actual error when initially registering (=> tell user their key is invalid),
                        // in the context of revalidation this is actually a valid case: the user must have given a valid key
                        // upon registration (or else it would not have ended up in the DB) and has now deleted the key
                        // => remove the validation role from the user
                        return false;
                    } else {
                        LOG.error(`Error occured while revalidating key ${r.api_key}. User will be excempt from this revalidation.`);
                        return undefined;
                    }
                }
            );
        await Timeout.set(RevalidationService.REAUTH_DELAY);
        release();


        if (typeof res === "string") {
            return { roleName: res, valid: true };
        } else if (typeof res === "boolean") {
            return { valid: false };
        } else return undefined;
    }

    private static readonly LOG_TYPE_DEAUTHORIZE: string = "unauth";


    private async handle(registration: Registration, authResult: { roleName?: string; valid: boolean }) {
        const guild: discord.Guild | null = await this.client.guilds.fetch(registration.guild);


        // filter out users for which we encountered errors
        if (!guild) {
            LOG.error(`Could not find a guild ${registration.guild}. Have I been kicked?`);
        } else {
            const member: discord.GuildMember | undefined = await guild.members.fetch(registration.user)
                .catch(ex => {
                    LOG.error(`Could not restrieve user ${registration.user}: ${ex.message}`);
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
                if (authResult.roleName !== undefined) {
                    if (registration.registration_role != authResult.roleName) {
                        //db update required ?
                        await this.client.registrationRepository.setRegistrationRoleById(registration.id, authResult.roleName);
                    }
                }
                const admittedRoleName = authResult.roleName;
                const admittedRole: discord.Role | undefined = guild.roles.cache.find(r => r.name === admittedRoleName);
                if (!admittedRole) { // false -> no role should be assigned assigned at all
                    LOG.error(`Can not find the role "${admittedRoleName}" that should be currently used.`);
                    throw new Error(`Can not find the role "${registeredWithRole}" that should be currently used.`);

                } else {
                    // user transferred to another admitted server -> update role
                    // log("info", `Changing role of user ${member.displayName} from ${currentRole} to ${admittedRole} (unless they are the same).`);
                    await this.client.validationService.setMemberRolesByString(member, [admittedRole.name], "ReAuthentication");
                    //assignServerRole(member, currentRole, admittedRole === undefined ? null : admittedRole);
                }
            }
        }
    }
}