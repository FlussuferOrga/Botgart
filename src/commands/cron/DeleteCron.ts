import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { logger } from "../../util/Logging";

const LOG = logger();

type Args = { id?: number };

/**
 Testcases:
 - missing parameters -> error
 - delete valid cron id -> successfully deletes cron from db and unschedules it
 - delete invalid cron id -> error
 - delete non-numeric cron id -> error
 - cron: anything -> error
 */
export class DeleteCron extends BotgartCommand {
    constructor() {
        super("deletecron", {
            aliases: ["deletecron", "rmcron"],
            channel: "guild",
            args: [
                {
                    id: "id",
                    type: "integer",
                },
            ],
            // userPermissions: ["ADMINISTRATOR"]
        });
    }

    checkArgs(args: Args): string | undefined {
        return args === undefined || args.id === undefined || args.id < 0 ? L.get(this.helptextKey()) : undefined;
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Args): Promise<boolean> {
        return await this.deleteCronjob(args.id as number);
    }

    async exec(message: discord.Message, args: Args): Promise<void> {
        if (!message.member) {
            await message.reply(L.get("NOT_AVAILABLE_AS_DM"));
            return;
        }

        const errorMessage = this.checkArgs(args);
        if (errorMessage) {
            await message.reply(errorMessage);
            return;
        }

        // not cronable, can be casted
        const mes = (await this.command(message, message.author, message.guild as discord.Guild, args))
            ? L.get("CRONJOB_DELETED")
            : L.get("CRONJOB_NOT_DELETED");
        await message.reply(mes);
    }

    /**
     * Deletes a scheduled cronjob from DB and/or schedule.
     * @param {int} id - ID of the cronjob to delete
     * @returns {boolean} - whether the cron was deleted from either DB or schedule.
     */
    async deleteCronjob(id: number): Promise<boolean> {
        let canceled = false;
        let deletedFromDB = false;
        const cl = this.getBotgartClient();
        if (id in cl.cronJobService.scheduledJobs) {
            cl.cronJobService.scheduledJobs.get(id)?.cancel();
            cl.cronJobService.scheduledJobs.delete(id);
            canceled = true;
            LOG.info("Canceled cronjob with ID {0}.".formatUnicorn(id));
        }
        if (await cl.cronJobRepository.deleteCronJob(id)) {
            deletedFromDB = true;
            LOG.info("Deleted cronjob with ID {0} from DB.".formatUnicorn(id));
        }
        return canceled || deletedFromDB;
    }
}

module.exports = DeleteCron;
