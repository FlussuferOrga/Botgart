const { Command } = require("discord-akairo");
const winston = require('winston');
const DB = require("../../DB.js");
const Util = require("../../Util.js");
const Const = require("../../Const.js");
const L = require("../../Locale.js");
const config = require("../../../config.json");

class ListCronsCommand extends Command {
    constructor() {
        super("listcrons", {
            aliases: ["listcrons","lscrons"],
            userPermissions: ["ADMINISTRATOR"]
        });
    }

    exec(message) {
        if(!message.member) {
            return message.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        let format = "{0} | {1} | {2} | {3} | {4} | {5} | {6}";
        let header = format.formatUnicorn("ID", "       GUILD      ", "    CREATED BY    ", "    CREATED AT     ", "    TIME   ", "COMMAND", "ARGUMENTS") + "\n";
        let mes = header;
        DB.getCronjobs().forEach((cron) => {
            let line = format.formatUnicorn(cron.id, cron.guild, cron.created_by, cron.created, cron.schedule, cron.command, cron.arguments) + "\n";
            if(mes.length + line.length < Const.MAX_MESSAGE_LENGTH - 10) {
                // leave some space for the backticks and additional linebreaks
                mes += line;
            } else {
                // message full -> send it and start a new one
                mes = "```\n" + mes + "\n```";
                message.author.send(mes);
                mes = header + line;
            }
        });
        message.author.send("```\n" + mes + "\n```");
    }
}

module.exports = ListCronsCommand;