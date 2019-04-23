"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:
- run in channel -> bot posts a list of commands
- run in DM -> bot posts a list of commands
- run per cron -> bot posts a list of commands
- run with very long help text (change desc for some commands in Locale) > 2000 chars -> response comes in parts
- run with one very long help text (change desc for one command in Locale) > 2000 chars -> that command is omitted
*/
class PipeGuildLogCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("pipeguildlog", {
            aliases: ["glog"],
            split: "quoted",
            args: [
                {
                    id: "guildname",
                    type: "string",
                },
                {
                    id: "apikey",
                    type: "string" //"commandAlias"
                },
                {
                    id: "channel",
                    type: "textChannel"
                },
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_GUILD_LOG");
    }
    checkArgs(args) {
        return !args || !args.guildnamechannel || !args.question || !args.emotes || args.emotes.length < 1 ? L.get("HELPTEXT_POLL") : undefined;
    }
    command(message, responsible, guild, args) {
    }
}
exports.PipeGuildLogCommand = PipeGuildLogCommand;
module.exports = PipeGuildLogCommand;
