import * as discord from "discord.js";
import { log } from "../Util";
import * as L from "../Locale";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import * as db from "../DB";

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
                userPermissions: ["ADMINISTRATOR"]
            },
            true, // available as DM
            true // cronable
        );
    }

    public command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Object): void {
        const cl = this.getBotgartClient();
        const designations: db.DesignatedRole[] = cl.db.getDesignatedRoles();
        let g: discord.Guild;
        let m: discord.GuildMember;
        let r: discord.Role;
        designations.forEach(async d => {
            if(!g || g.id != d.guild) {
                // designations come ordered by guild. This trick allows us to
                // find each guild only once.
                g = cl.guilds.cache.find(g => g.id == d.guild);
            }
            r = g.roles.cache.find(role => role.name === d.registration_role);
            m = await guild.members.fetch(d.user); // cache.find(member => member.user.id === d.user);
            if(!r) {
                log("error", "RepairRoles.js", "Was supposed to assign role '{0}' to user, but could not find it.".formatUnicorn(d.registration_role));
            } else {
                if(!m) {
                    log("error", "RepairRoles.js", "User {0} is not present in this guild.".formatUnicorn(d.user));
                } else {
                    if(!m.roles.cache.find(role => role.name === r.name)) {
                        m.roles.add(r)
                            .then(()   => log("info", "RepairRoles.js", "Gave role {0} to user {1}".formatUnicorn(r.name, m.displayName)))
                            .catch(err => log("error", "RepairRoles.js", "Could not give role {0} to user {1}: {2}.".formatUnicorn(r.name, m.displayName, err)));
                    }
                }
            }
        });
    }
}

module.exports = RepairRoles;