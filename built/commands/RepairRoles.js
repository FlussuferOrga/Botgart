"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:
- run without any changes -> nothing happens
- remove role from user manually after registration -> users should get their roles back
- remove role from server -> error

*/
class RepairRolesCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("repairroles", {
            aliases: ["rolerepair"],
            userPermissions: ["ADMINISTRATOR"]
        }, true, // available as DM
        true // cronable
        );
    }
    desc() {
        return L.get("DESC_REPAIR_ROLES");
    }
    command(message, responsible, guild, args) {
        let cl = this.client;
        let designations = cl.db.getDesignatedRoles();
        let g, m, r;
        designations.forEach(d => {
            if (!g || g.id != d.guild) {
                // designations come ordered by guild. This trick allows us to
                // find each guild only once.
                g = cl.guilds.find(g => g.id == d.guild);
            }
            r = g.roles.find(role => role.name === d.registration_role);
            m = guild.members.find(member => member.user.id === d.user);
            if (!r) {
                Util_1.log("error", "RepairRoles.js", "Was supposed to assign role '{0}' to user, but could not find it.".formatUnicorn(d.registration_role));
            }
            else {
                if (!m) {
                    Util_1.log("error", "RepairRoles.js", "User {0} is not present in this guild.".formatUnicorn(d.user));
                }
                else {
                    if (!m.roles.find(role => role.name === r.name)) {
                        m.addRole(r)
                            .then(() => Util_1.log("info", "RepairRoles.js", "Gave role {0} to user {1}".formatUnicorn(r.name, m.displayName)))
                            .catch(err => Util_1.log("error", "RepairRoles.js", "Could not give role {0} to user {1}: {2}.".formatUnicorn(r.name, m.displayName, err)));
                    }
                }
            }
        });
    }
}
exports.RepairRolesCommand = RepairRolesCommand;
module.exports = RepairRolesCommand;
