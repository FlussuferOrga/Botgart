import * as discord from "discord.js";
import { log } from "../Util";
import * as L from "../Locale";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:
- run without any changes -> nothing happens (no output either)
- remove role from user manually after registration -> users should get their roles back (output on console)
- remove role from server -> error on console
*/
export class RepairRolesCommand extends BotgartCommand {
    public constructor() {
        super("repairroles", {
                aliases: ["rolerepair"],
                userPermissions: ["ADMINISTRATOR"]
            },
            true, // available as DM
            true // cronable
        );
    }

    public desc() {
        return L.get("DESC_REPAIR_ROLES");
    }

    public command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Object): void {
        let cl = <BotgartClient>this.client;
        let designations = cl.db.getDesignatedRoles();
        let g, m, r;
        designations.forEach(d => {
            if(!g || g.id != d.guild) {
                // designations come ordered by guild. This trick allows us to
                // find each guild only once.
                g = cl.guilds.find(g => g.id == d.guild);
            }
            r = g.roles.find(role => role.name === d.registration_role);
            m = guild.members.find(member => member.user.id === d.user);
            if(!r) {
                log("error", "RepairRoles.js", "Was supposed to assign role '{0}' to user, but could not find it.".formatUnicorn(d.registration_role));
            } else {
                if(!m) {
                    log("error", "RepairRoles.js", "User {0} is not present in this guild.".formatUnicorn(d.user));
                } else {
                    if(!m.roles.find(role => role.name === r.name)) {
                        m.addRole(r)
                            .then(()   => log("info", "RepairRoles.js", "Gave role {0} to user {1}".formatUnicorn(r.name, m.displayName)))
                            .catch(err => log("error", "RepairRoles.js", "Could not give role {0} to user {1}: {2}.".formatUnicorn(r.name, m.displayName, err)));
                    }
                }
            }
        });
    }
}

module.exports = RepairRolesCommand;