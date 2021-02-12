import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { log } from "../../Util";

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
                aliases: ["deletecron","rmcron"],
                args: [
                    {
                        id: "id",
                        type: "integer",
                    }
                ],
                // userPermissions: ["ADMINISTRATOR"]
            }
        );
    }

    checkArgs(args: any): string|undefined {
        return args === undefined || args.id === undefined || args.id < 0 ?L.get(this.helptextKey()) : undefined;
    }

    command(message: discord.Message , responsible: discord.User, guild: discord.Guild, args: any): boolean {
        return this.deleteCronjob(args.id);
    }

    exec(message: discord.Message, args: any): void {
        if(!message.member) {
            message.util?.send(L.get("NOT_AVAILABLE_AS_DM"));
            return;
        }

        const errorMessage = this.checkArgs(args);
        if(errorMessage) {
            message.util?.send(errorMessage);
            return;
        }
        
        // not cronable, can be casted
        const mes = this.command(message, message.author, <discord.Guild>message.guild, args) ? L.get("CRONJOB_DELETED") : L.get("CRONJOB_NOT_DELETED");
        message.util?.send(mes);
    }

    /**
    * Deletes a scheduled cronjob from DB and/or schedule.
    * @param {int} id - ID of the cronjob to delete
    * @returns {boolean} - whether the cron was deleted from either DB or schedule.
    */
    deleteCronjob(id: number): boolean {
        let canceled = false;
        let deletedFromDB = false;
        let cl = this.getBotgartClient();
        if (id in cl.cronjobs) {
            cl.cronjobs[id].cancel();
            delete cl.cronjobs[id];
            canceled = true;
            log("info", "Canceled cronjob with ID {0}.".formatUnicorn(id));
        }
        if (cl.cronjobRepository.deleteCronJob(id)) {
            deletedFromDB = true;
            log("info", "Deleted cronjob with ID {0} from DB.".formatUnicorn(id));
        }
        return canceled || deletedFromDB;
    }
}

module.exports = DeleteCron;