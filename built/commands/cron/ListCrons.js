"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../../Util");
const Const = __importStar(require("../../Const"));
const L = __importStar(require("../../Locale"));
const BotgartCommand_1 = require("../../BotgartCommand");
/**
Testcases:
- regular use -> bot DMs cron list
- with no crons in db -> bot DMs nothing
- cron: anything -> error
*/
class ListCronsCommand extends BotgartCommand_1.BotgartCommand {
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
        Util_1.assertType(responsible, "User");
        Util_1.assertType(guild, "Guild");
        if (!responsible) {
            Util_1.log("error", "ListCrons.js", "Can not execute lscron without member to reply to. Canceling.");
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
exports.ListCronsCommand = ListCronsCommand;
