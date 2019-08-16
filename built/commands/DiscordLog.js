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

*/
class DiscordLogCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("discordlog", {
            aliases: ["discordlog"],
            split: "quoted",
            args: [
                {
                    id: "type",
                    type: "string"
                },
                {
                    id: "channel",
                    type: "textChannel"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        true, // cronable
        0);
    }
    desc() {
        return L.get("DESC_DISCORD_LOG");
    }
    command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        cl.db.addLogChannel(guild, args.type, args.channel);
        Util_1.log("notice", "DiscordLog.js", "Set up log channel '{0}' for event type '{1}' in guild '{2}'.".formatUnicorn(args.channel.name, args.type, guild.name));
        message.react("✅"); // that's a white checkmark, even if not rendered properly...
    }
    checkArgs(args) {
        return !args || !args.channel || !args.type ? L.get("HELPTEXT_DISCORD_LOG") : undefined;
    }
}
exports.DiscordLogCommand = DiscordLogCommand;
module.exports = DiscordLogCommand;
