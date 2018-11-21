const { Command } = require("discord-akairo");
const winston = require("winston");
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
class HelpCommand extends BotgartCommand {
    constructor() {
        super("help", {
            aliases: ["help", "commands"],
        },
        true, // available per DM
        true // cronable
        );
    }

    desc() {
        return L.get("DESC_HELP");
    }

    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        let descs = "**Verfügbare Befehle:**\n\n"
                    .concat(Array.from(this.client.commandHandler.modules.values()).map(m => m.desc 
                        ? "`{0}` (bzw. {1}): {2}".formatUnicorn(
                            m.id,
                            m.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", "),
                            m.desc())
                        : m.id
                    ).join("\n\n"));

        // when having too many active commands, we could very well reach
        // the maximum message length from all the descriptions.
        // As a fallback, we break the message up to contain one command each.
        let ms = descs.length < Const.MAX_MESSAGE_LENGTH ? [descs] : descs.split("\n\n");
        ms.forEach(m => {
            this.reply(message, responsible, m).then(
                () => {},
                (err) => winston.log("error", err.message) //winston.log("error", "Help.js: help-string exceeds maximum length even after splitting on command-to-command-level. One or more desc-strings seem to be too long.")
            );
        });
        if(ms.length > 1) {
            winston.log("warn", "Help.js: help-string exceeds maximum message length. This case is covered, but you should look into cutting down the desc-strings for some commands.");
        }
    }
}

module.exports = HelpCommand;