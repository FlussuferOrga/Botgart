const { Command } = require("discord-akairo");
const { assertType, log } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");
/**
Testcases:
- regular use -> bot DMs cron list
- with no crons in db -> bot DMs nothing
- cron: anything -> error
*/
class ListCronsCommand extends BotgartCommand {
    constructor() {
        super("listcrons", {
            aliases: ["listcrons", "lscrons"],
            userPermissions: ["ADMINISTRATOR"]
        }, true, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_LIST_CRONS");
    }
    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        if (!responsible) {
            log("error", "ListCrons.js", "Can not execute lscron without member to reply to. Canceling.");
            return;
        }
        let format = "{0} | {1} | {2} | {3} | {4} | {5} | {6}";
        let header = format.formatUnicorn("ID", "       GUILD      ", "    CREATED BY    ", "    CREATED AT     ", "    TIME   ", "COMMAND", "ARGUMENTS") + "\n";
        let mes = header;
        this.client.db.getCronjobs().forEach((cron) => {
            let line = format.formatUnicorn(cron.id, cron.guild, cron.created_by, cron.created, cron.schedule, cron.command, cron.arguments) + "\n";
            if (mes.length + line.length < Const.MAX_MESSAGE_LENGTH - 10) {
                // leave some space for the backticks and additional linebreaks
                mes += line;
            }
            else {
                // message full -> send it and start a new one
                mes = "```\n" + mes + "\n```";
                responsible.send(mes);
                mes = header + line;
            }
        });
        responsible.send("```\n" + mes + "\n```");
    }
}
module.exports = ListCronsCommand;
