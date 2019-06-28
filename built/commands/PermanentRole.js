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
const Util = __importStar(require("../Util"));
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class PermanentRoleCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("permanentrole", {
            aliases: ["permarole"],
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
        return L.get("DESC_ADD_PERMAROLE");
    }
    command(message, responsible, guild, args) {
        if (!message) {
            Util.log("error", "PermanentRole.js", "Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }
        let cl = this.client;
        let success = cl.db.storePermanentRole(args.member.user.id, message.guild.id, args.role.name);
        if (success) {
            Util.log("info", "PermanentRole.js", "Successfully added role {0} to user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_ADD_SUCC"));
        }
        else {
            Util.log("info", "PermanentRole.js", "Could not add role {0} to user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_ADD_FAIL"));
        }
    }
}
exports.PermanentRoleCommand = PermanentRoleCommand;
module.exports = PermanentRoleCommand;
