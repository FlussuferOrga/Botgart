import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as Const from "../../util/Const";
import { logger } from "../../util/Logging";

const LOG = logger();

/**
 Testcases:
 - regular use -> bot DMs cron list
 - with no crons in db -> bot DMs nothing
 - cron: anything -> error
 */
export class ListCrons extends BotgartCommand {
    constructor() {
        super(
            "listcrons",
            {
                aliases: ["listcrons", "lscrons"],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {}
        );
    }

    async command(message: discord.Message | null, responsible: discord.User, guild: discord.Guild, args) {
        if (!responsible) {
            LOG.error("Can not execute lscron without member to reply to. Canceling.");
            return;
        }
        const format = "{0} | {1} | {2} | {3} | {4} | {5} | {6}";
        const header =
            format.formatUnicorn("ID", "       GUILD      ", "    CREATED BY    ", "    CREATED AT     ", "    TIME   ", "COMMAND", "ARGUMENTS") +
            "\n";
        let mes = header;
        const cronJobs = await this.getBotgartClient().cronJobRepository.getCronJobs();
        cronJobs.forEach((cron) => {
            const line = format.formatUnicorn(cron.id, cron.guild, cron.createdBy, cron.created, cron.schedule, cron.command, cron.arguments) + "\n";
            if (mes.length + line.length < Const.MAX_MESSAGE_LENGTH - 10) {
                // leave some space for the backticks and additional linebreaks
                mes += line;
            } else {
                // message full -> send it and start a new one
                mes = "```\n" + mes + "\n```";
                message?.reply(mes);
                mes = header + line;
            }
        });
        message?.reply("```\n" + mes + "\n```");
    }
}

module.exports = ListCrons;
