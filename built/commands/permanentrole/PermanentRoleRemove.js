"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const Util = __importStar(require("../../Util"));
const L = __importStar(require("../../Locale"));
const BotgartCommand_1 = require("../../BotgartCommand");
/**
Testcases:

*/
class PermanentRoleRemoveCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("removepermanentrole", {
            aliases: ["removepermarole", "removepermanentrole", "rmprole"],
            args: [
                {
                    id: "member",
                    type: "member"
                },
                {
                    id: "role",
                    type: "role"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_RM_PERMAROLE");
    }
    checkArgs(args) {
        return !args || !args.member || !args.role ? L.get("HELPTEXT_RM_PERMAROLE") : undefined;
    }
    command(message, responsible, guild, args) {
        if (!message) {
            Util.log("error", "PermanentRoleRemove.js", "Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }
        let cl = this.client;
        let success = cl.db.deletePermanentRole(args.member.user.id, message.guild.id, args.role.name);
        if (success) {
            Util.log("info", "PermanentRoleRemove.js", "Successfully removed role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_RM_SUCC"));
        }
        else {
            Util.log("info", "PermanentRoleRemove.js", "Could not remove role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_RM_FAIL"));
        }
    }
}
exports.PermanentRoleRemoveCommand = PermanentRoleRemoveCommand;
module.exports = PermanentRoleRemoveCommand;
