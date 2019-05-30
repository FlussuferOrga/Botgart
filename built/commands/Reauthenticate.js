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
- missing parameters -> error
- regular use -> reauth success
- remove a formerly valid API key with user still in guild -> key gets unauthenticated, user gets his auth role removed
- remove a formerly valid API key with user no longer in guild -> key gets unauthenticated
- cron: all of the above -> reauth success
*/
class ReauthenticateCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("reauthenticate", {
            aliases: ["reauthenticate", "reauth"],
            userPermissions: ['ADMINISTRATOR']
        }, true, // available per DM
        true // cronable
        );
    }
    desc() {
        return L.get("DESC_REAUTHENTICATE");
    }
    command(message, responsible, guild, args) {
        let cl = this.client;
        cl.db.revalidateKeys().then(prune => {
            let guild, currentRole, admittedRole;
            prune.forEach(row => {
                let [p, admittedRoleName] = row;
                let currentRoleName = p.registration_role;
                if (!guild || guild.id != p.guild) {
                    // prunes come ordered by guild. This trick allows us to
                    // find each guild only once.
                    guild = cl.guilds.find(g => g.id == p.guild);
                    admittedRole = guild ? guild.roles.find(r => r.name === admittedRoleName) : undefined;
                    currentRole = guild ? guild.roles.find(r => r.name === currentRoleName) : undefined;
                }
                if (!guild) {
                    Util_1.log("error", "Reauthenticate.js", "Could not find a guild {0}. Have I been kicked?".formatUnicorn(p.guild));
                }
                else {
                    let m = guild.members.find(member => p.user == member.user.id);
                    if (!m) {
                        Util_1.log("info", "Reauthenticate.js", "{0} is no longer part of the guild.".formatUnicorn(p.user));
                    }
                    else {
                        if (admittedRoleName === false || admittedRoleName === Util_1.validateWorld.ERRORS.invalid_key) {
                            // user should be pruned: user has either transed (false) or deleted their key (invalid key)
                            Util_1.log("info", "Reauthenticate.js", "Pruning {0}.".formatUnicorn(m.user.username));
                            m.removeRole(currentRole);
                            cl.db.deleteKey(p.api_key);
                            m.send(L.get("KEY_INVALIDATED"));
                        }
                        else {
                            // user transed to another admitted server -> update role
                            Util_1.assignServerRole(m, currentRole, admittedRole);
                        }
                    }
                }
            });
        });
        Util_1.log("info", "Reauthenticate.js", "Pruning complete.");
    }
    postExecHook(message, args, result) {
        return message.util.send(L.get("PRUNING_COMPLETE"));
    }
}
exports.ReauthenticateCommand = ReauthenticateCommand;
module.exports = ReauthenticateCommand;
