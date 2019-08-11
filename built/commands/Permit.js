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
const discord = __importStar(require("discord.js"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class PermitCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("permit", {
            aliases: ["permit", "allow", "permission"],
            split: "quoted",
            args: [
                {
                    id: "command",
                    type: "commandAlias"
                },
                {
                    id: "receiver",
                    type: (word, message, prevArgs) => {
                        let receiver;
                        const snowflake = word.match(/<@(&)?(\d*)>/);
                        if (snowflake !== null) {
                            const isGroup = snowflake[1] !== undefined;
                            const snowflakeId = snowflake[2];
                            if (message.guild) {
                                // either group or guildmember
                                receiver = isGroup
                                    ? message.guild.roles.find(r => r.id === snowflakeId)
                                    : message.guild.members.find(m => m.id === snowflakeId);
                            }
                            else {
                                // direct message -> user 
                                receiver = this.client.users.find(u => u.id === snowflakeId);
                            }
                        }
                        else {
                            // plaintext name -> try to resolve among guild members and roles as fallback
                            if (message.guild) {
                                receiver = message.guild.members.find(m => m.displayName === word)
                                    || message.guild.roles.find(r => r.name === word);
                            }
                        }
                        return receiver;
                    }
                },
                {
                    id: "value",
                    type: "integer",
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        true, // cronable
        0);
    }
    checkArgs(args) {
        return !args || !args.command || !args.receiver || args.value === undefined ? L.get("HELPTEXT_PERMIT") : undefined;
    }
    desc() {
        return L.get("DESC_PERMIT");
    }
    command(message, responsible, guild, args) {
        const cmd = args.command.id;
        const receiver = args.receiver.id;
        const type = (args.receiver instanceof discord.Role) ? BotgartCommand_1.PermissionTypes.role : BotgartCommand_1.PermissionTypes.user;
        const receiverName = (args.receiver instanceof discord.Role) ? args.receiver.name : args.receiver.displayName;
        const value = args.value;
        const perm = this.client.db.setPermission(cmd, receiver, type, value, message.guild.id);
        this.reply(message, responsible, L.get("PERMISSION_SET_TO", [receiverName, cmd, perm])).then(() => { }, (err) => Util_1.log("error", "PermitCommand.js", err.message));
    }
}
exports.PermitCommand = PermitCommand;
module.exports = PermitCommand;
