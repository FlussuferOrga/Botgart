import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { DesignatedRole } from "../repositories/RegistrationRepository";
import { log } from "../Util";

/**
Testcases:
- run without any changes -> nothing happens (no output either)
- remove role from user manually after registration -> users should get their roles back (output on console)
- remove role from server -> error on console
*/
export class RepairRoles extends BotgartCommand {
    public constructor() {
        super("repairroles", {
                aliases: ["rolerepair"],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                availableAsDM: true,
                cronable: true
            }
        );
    }

    public command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Object): void {
        const cl = this.getBotgartClient();
        const designations: DesignatedRole[] = cl.registrationRepository.getDesignatedRoles();
        let g: discord.Guild | undefined = undefined;
        let m: discord.GuildMember;
        let r: discord.Role | undefined;
        designations.forEach(async d => {
            if(g === undefined || g.id != d.guild) {
                // designations come ordered by guild. This trick allows us to
                // find each guild only once.
                g = cl.guilds.cache.find(g => g.id == d.guild);
            }
            // check again, in case lookup fails
            if(g === undefined) {
                log("error", `Could not look up a guild with ID ${d.guild}. Have I been kicked?`);
            } else {
                r = g.roles.cache.find(role => role.name === d.registration_role);
                m = await guild.members.fetch(d.user); // cache.find(member => member.user.id === d.user);
                if(r === undefined) {
                    log("error", `Was supposed to assign role '${d.registration_role}' to user, but could not find it.`);
                } else {
                    if(!m) {
                        log("error", `User ${d.user} is not present in this guild.`);
                    } else {
                        if(!m.roles.cache.find(role => role.name === (<discord.Role>r).name)) {
                            m.roles.add((<discord.Role>r))
                                .then(()   => log("info", `Gave role ${(<discord.Role>r).name} to user ${m.displayName}`))
                                .catch(err => log("error", `Could not give role ${(<discord.Role>r).name} to user ${m.displayName}: ${err}.`));
                        }
                    }
                }                
            }

        });
    }
}

module.exports = RepairRoles;