import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as Const from "../../Const";
import { assertType, log } from "../../Util";

/**
Testcases:
- regular use -> bot DMs cron list
- with no crons in db -> bot DMs nothing
- cron: anything -> error
*/
export class ListCrons extends BotgartCommand {
    constructor() {
        super("listcrons", {
                aliases: ["listcrons","lscrons"],
                // userPermissions: ["ADMINISTRATOR"]
            }, 
            {
                availableAsDM: true
            }
        );
    }

    command(message: discord.Message|null, responsible: discord.User, guild: discord.Guild, args: any) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        if(!responsible) {
            log("error", "Can not execute lscron without member to reply to. Canceling.");
            return;
        }
        let format = "{0} | {1} | {2} | {3} | {4} | {5} | {6}";
        let header = format.formatUnicorn("ID", "       GUILD      ", "    CREATED BY    ", "    CREATED AT     ", "    TIME   ", "COMMAND", "ARGUMENTS") + "\n";
        let mes = header;
        this.getBotgartClient().cronjobRepository.getCronJobs().forEach((cron) => {
            let line = format.formatUnicorn(cron.id, cron.guild, cron.created_by, cron.created, cron.schedule, cron.command, cron.arguments) + "\n";
            if(mes.length + line.length < Const.MAX_MESSAGE_LENGTH - 10) {
                // leave some space for the backticks and additional linebreaks
                mes += line;
            } else {
                // message full -> send it and start a new one
                mes = "```\n" + mes + "\n```";
                responsible.send(mes);
                mes = header + line;
            }
        });
        responsible.send("```\n" + mes + "\n```");
    }
}

module.exports = ListCrons;