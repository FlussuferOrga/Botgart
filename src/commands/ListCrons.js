const { Command } = require("discord-akairo");
const winston = require('winston');
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");

class ListCronsCommand extends Command {
    constructor() {
        super("listcrons", {
            aliases: ["listcrons","lscrons"],
            split: "quoted",
            args: [
                {
                    id: "id",
                    type: "int",
                    default: ""
                }
            ]
        });
    }

    exec(message, args) {
        if(!message.member) {
            return message.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        let format = "{0} | {1} | {2} | {3} | {4} | {5} | {6}";
        let header = format.formatUnicorn("ID", "TIME", "COMMAND", "ARGUMENTS", "GUILD", "CREATED BY", "CREATED AT") + "\n";
        let mes = header;
        DB.getCronjobs().forEach((cron) => {
            let line = format.formatUnicorn(cron.id, cron.schedule, cron.command, cron.arguments, cron.guild, cron.created_by, cron.created) + "\n";
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