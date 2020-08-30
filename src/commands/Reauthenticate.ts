import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import { validateWorld } from "../Gw2ApiUtils";
import * as L from "../Locale";
import { assignServerRole, formatUserPing, log } from "../Util";
import { Registration } from "../repositories/RegistrationRepository";

/**
Testcases:
- missing parameters -> error
- regular use -> reauth success
- remove a formerly valid API key with user still in guild -> key gets unauthenticated, user gets his auth role removed
- remove a formerly valid API key with user no longer in guild -> key gets unauthenticated
- cron: all of the above -> reauth success
*/
export class Reauthenticate extends BotgartCommand {
    private static readonly LOG_TYPE_UNAUTH : string = "unauth";

    constructor() {
        super("reauthenticate", {
            aliases: ["reauthenticate","reauth"],
            userPermissions: ['ADMINISTRATOR']
        },
        {
            availableAsDM: true,
            cronable: true
        }
        );
    }

    command(message: discord.Message, responsible: discord.User, sguild: discord.Guild, args) {
        const cl: BotgartClient = this.getBotgartClient();
        cl.registrationRepository.revalidateKeys().then(
            update => {
                if(update === undefined) {
                    log("error", "API validation yielded undefined for the entire result of revalidations. Critical error!");
                    return;
                }
                let g: discord.Guild | null; // resolve() can result in null, not undefined... 
                let currentRole: discord.Role | undefined;
                let admittedRole: discord.Role | undefined;
                // filter out users for which we encountered errors
                update.filter(r => r !== undefined).forEach(async (row : [Registration, string | boolean]) => {
                    const [p, admittedRoleName] = row;
                    let currentRoleName: string = p.registration_role;

                    if(!g || g.id != p.guild) {
                        // prunes come ordered by guild. This trick allows us to
                        // resolve each guild only once.
                        try {
                            g = await cl.guilds.fetch(p.guild);    
                        } catch(ex) {
                            log("error", "Could not fetch the guild with ID ${p.guild}. Have I been kicked?");
                        }
                        
                        //g = cl.guilds.resolve(p.guild); //cl.guilds.cache.find(g => g.id == p.guild);
                    }
                    if(!g) {
                        log("error", `Could not find a guild ${p.guild}. Have I been kicked?`)
                    } else {
                        admittedRole = g.roles.cache.find(r => r.name === admittedRoleName);
                        currentRole  = g.roles.cache.find(r => r.name === currentRoleName);
                        if(admittedRoleName !== false && !admittedRole) { // false -> no role should be assigned assigned at all
                            log("error", `Can not find a role ${admittedRoleName} to assign.`);
                        }
                        if(!currentRole) {
                            log("error", `Can not find a role ${currentRoleName} that should be currently used. This will cancel all reauths for users that should currently have this role!`);
                        }
                        if((admittedRole || admittedRoleName === false) && currentRole) { // admittedRoleName === false means: user must be unauthed
                            const m: discord.GuildMember | undefined = await g.members.fetch(p.user)
                                                                                      .catch(ex => { 
                                                                                                      log("error", `Could not restrieve user ${p.user}: ${ex.message}`); 
                                                                                                      return undefined; 
                                                                                                   });
                            if(!m) {
                                log("info", `${p.user} is no longer part of the guild. Deleting their key.`);
                                cl.discordLog(g, Reauthenticate.LOG_TYPE_UNAUTH, L.get("DLOG_UNAUTH", [formatUserPing(p.user), p.account_name, p.registration_role]));
                                cl.registrationRepository.deleteKey(p.api_key);
                            } else {
                                if(admittedRoleName === false) {
                                    // user should be pruned: user has either transed (false) or deleted their key (invalid key)
                                    log("info", "Unauthing {0}.".formatUnicorn(m.user.username));
                                    m.roles.remove(currentRole);
                                    cl.registrationRepository.deleteKey(p.api_key);
                                    cl.discordLog(g, Reauthenticate.LOG_TYPE_UNAUTH, L.get("DLOG_UNAUTH", [formatUserPing(p.user), p.account_name, p.registration_role]));
                                    m.send(L.get("KEY_INVALIDATED"));
                                } else {
                                    // user transed to another admitted server -> update role
                                    log("info", `Changing role of user ${m.displayName} from ${currentRole} to ${admittedRole} (unless they are the same).`);
                                    assignServerRole(m, currentRole, admittedRole === undefined ? null : admittedRole);
                                }
                            }
                        }
                    }               
                });
            }
        );
        log("info", "Reauthentication started.");      
    }

    postExecHook(message, args, result) {
        return message.util.send(L.get("PRUNING_COMPLETE"));
    }
}

module.exports = Reauthenticate;