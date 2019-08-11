"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord = __importStar(require("discord.js"));
const Util_1 = require("../Util");
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:
- missing parameters -> error
- regular say -> bot posts text
- with invalid channel -> error
- from cron: remove channel bot was supposed to talk in -> error
*/
class SayCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("say", {
            aliases: ["say", "speak"],
            split: "quoted",
            args: [
                {
                    id: "channel",
                    type: "textChannel"
                },
                {
                    id: "text",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        true, // cronable
        0);
    }
    desc() {
        return L.get("DESC_SAY");
    }
    command(message, responsible, guild, args) {
        // Note that this callback could take place long after the cron was scheduled.
        // So the bot could no longer be there. We therefore need to find() the guild
        // again to make sure the bot is still on there.
        let result;
        let g = this.client.guilds.find(g => g.id == guild.id);
        if (!g) {
            Util_1.log("error", "Say.js", "I am not a member of guild {0}.".formatUnicorn(guild.id));
            result = false;
        }
        else {
            let c = g.channels.find(c => c.id == args.channel.id && c instanceof discord.TextChannel);
            if (!c) {
                Util_1.log("error", "Say.js", "Can not find a channel {0}.".formatUnicorn(args.channel.id));
                result = false;
            }
            else {
                c.send(args.text);
                Util_1.log("info", "Say.js", "Executed Say.");
                result = true;
            }
        }
        return result;
    }
    checkArgs(args) {
        return !args || !args.channel || !args.text ? L.get("HELPTEXT_SAY") : undefined;
    }
    serialiseArgs(args) {
        let clone = Object.assign({}, args);
        clone.channel = { guild: args.channel.guild.id, channel: args.channel.id };
        return JSON.stringify(clone);
    }
    deserialiseArgs(jsonargs) {
        let args = JSON.parse(jsonargs);
        let guild = this.client.guilds.find(g => g.id == args.channel.guild);
        args.channel = guild.channels.find(c => c.id == args.channel.channel);
        return args;
    }
}
exports.SayCommand = SayCommand;
module.exports = SayCommand;
