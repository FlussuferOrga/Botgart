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
        let descs = "**Verfügbare Befehle:**\n"
                    .concat(Array.from(this.client.commandHandler.modules.values()).map(m => m.desc 
                        ? "`{0}` ({1}): {2}".formatUnicorn(
                            m.id,
                            m.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", "),
                            m.desc())
                        : m.id
                    ).join("\n\n"))
        if(message) {
            message.util.send(descs);
        } else {
            responsible.send(descs);
        }
    }
}

module.exports = HelpCommand;