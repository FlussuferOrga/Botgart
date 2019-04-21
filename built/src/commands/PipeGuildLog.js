const { Command } = require("discord-akairo");
const { assertType } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");
/**
Testcases:
- run in channel -> bot posts a list of commands
- run in DM -> bot posts a list of commands
- run per cron -> bot posts a list of commands
- run with very long help text (change desc for some commands in Locale) > 2000 chars -> response comes in parts
- run with one very long help text (change desc for one command in Locale) > 2000 chars -> that command is omitted
*/
class PipeGuildLog extends BotgartCommand {
    constructor() {
        super("pipeguildlog", {
            aliases: ["glog"],
            split: "quoted",
            args: [
                {
                    id: "guildname",
                    type: "string"
                },
                {
                    id: "apikey",
                    type: "apikey",
                },
                {
                    id: "channel",
                    type: "textChannel"
                }
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
        assertType(responsible, "User");
        let guildname = args;
        // if this command is issued on a server, only the commands the user can execute
        // are listed.
        // Issueing this command through DMs give the full list. This is not a security issue,
        // since the restricted listing is just a convenience for users to present them with a
        // more compact help text.
        let member = guild ? guild.members.find(m => m.id == responsible.id) : undefined;
        let checkPermissions = member ? member.permissions.has.bind(member.permissions) : () => true;
        let descs = "**Verfügbare Befehle:**\n\n"
            .concat(Array.from(this.client.commandHandler.modules.values())
            .filter(m => !m.userPermissions || checkPermissions(m.userPermissions))
            .map(m => m.desc
            ? "**`{0}`** (bzw. {1}): {2}".formatUnicorn(m.id, m.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", "), m.desc())
            : m.id).join("\n\n"));
        // when having too many active commands, we could very well reach
        // the maximum message length from all the descriptions.
        // As a fallback, we break the message up to contain one command each.
        let ms = descs.length < Const.MAX_MESSAGE_LENGTH ? [descs] : descs.split("\n\n");
        ms.forEach(m => {
            this.reply(message, responsible, m).then(() => { }, (err) => Util.log("error", "PipeGuildLog.js", err.message) // help-string exceeds maximum length even after splitting on command-to-command-level. One or more desc-strings seem to be too long.")
            );
        });
        if (ms.length > 1) {
            Util.log("warn", "PipeGuildLog.js", "help-string exceeds maximum message length. This case is covered, but you should look into cutting down the desc-strings for some commands.");
        }
    }
}
module.exports = PipeGuildLog;
