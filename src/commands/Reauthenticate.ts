import { Command } from "discord-akairo";
import { formatUserPing, log, validateWorld, assignServerRole } from "../Util";
import * as L from "../Locale";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:
- missing parameters -> error
- regular use -> reauth success
- remove a formerly valid API key with user still in guild -> key gets unauthenticated, user gets his auth role removed
- remove a formerly valid API key with user no longer in guild -> key gets unauthenticated
- cron: all of the above -> reauth success
*/
export class ReauthenticateCommand extends BotgartCommand {
    private static readonly LOG_TYPE_UNAUTH : string = "unauth";

    constructor() {
        super("reauthenticate", {
            aliases: ["reauthenticate","reauth"],
            userPermissions: ['ADMINISTRATOR']
        },
        true, // available per DM
        true // cronable
        );
    }

    desc() {
        return L.get("DESC_REAUTHENTICATE");
    }

    command(message, responsible, guild, args) {
        let cl = this.getBotgartClient();
        cl.db.revalidateKeys().then(
            update => {                    
                let guild, currentRole, admittedRole;
                // filter out users for which we encountered errors
                update.filter(r => r !== undefined).forEach(row => {
                    let [p,admittedRoleName] = row;
                    let currentRoleName = p.registration_role;

                    if(!guild || guild.id != p.guild) {
                        // prunes come ordered by guild. This trick allows us to
                        // find each guild only once.
                        guild = cl.guilds.find(g => g.id == p.guild);
                    }
                    if(!guild) {
                        log("error", "Reauthenticate.js", "Could not find a guild {0}. Have I been kicked?".formatUnicorn(p.guild))
                    } else {
                        admittedRole = guild.roles.find(r => r.name === admittedRoleName);
                        currentRole  = guild.roles.find(r => r.name === currentRoleName);
                        if(!admittedRole) {
                            log("error", "Reauthenticate.js", "Can not find a role {0} to assign.".formatUnicorn(admittedRoleName));
                        }
                        if(!currentRole) {
                            log("error", "Reauthenticate.js", "Can not find a role {0} that should be currently used.".formatUnicorn(currentRoleName));
                        }
                        if((admittedRole || admittedRoleName === false) && currentRole) { // admittedRoleName === false means: user must be pruned
                            let m = guild.members.find(member => p.user == member.user.id);
                            if(!m) {
                                log("info", "Reauthenticate.js", "{0} is no longer part of the guild. Deleting their key.".formatUnicorn(p.user));
                                cl.discordLog(guild, ReauthenticateCommand.LOG_TYPE_UNAUTH, L.get("DLOG_UNAUTH", [formatUserPing(p.user), p.account_name, p.registration_role]));
                                cl.db.deleteKey(p.api_key);
                            } else {
                                if(admittedRoleName === false || admittedRoleName === validateWorld.ERRORS.invalid_key) {
                                    // user should be pruned: user has either transed (false) or deleted their key (invalid key)
                                    log("info", "Reauthenticate.js", "Pruning {0}.".formatUnicorn(m.user.username));
                                    m.removeRole(currentRole);
                                    cl.db.deleteKey(p.api_key);
                                    cl.discordLog(guild, ReauthenticateCommand.LOG_TYPE_UNAUTH, L.get("DLOG_UNAUTH", [formatUserPing(p.user), p.account_name, p.registration_role]));
                                    m.send(L.get("KEY_INVALIDATED"));
                                } else {
                                    // user transed to another admitted server -> update role
                                    assignServerRole(m, currentRole, admittedRole);
                                }
                            }
                        }
                    }               
                });
            }
        );
        log("info", "Reauthenticate.js", "Pruning complete.");      
    }

    postExecHook(message, args, result) {
        return message.util.send(L.get("PRUNING_COMPLETE"));
    }
}

module.exports = ReauthenticateCommand;