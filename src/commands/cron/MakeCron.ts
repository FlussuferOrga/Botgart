import { Message } from "discord.js";
import * as schedule from "node-schedule";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { logger } from "../../util/Logging";

const LOG = logger();

/**
 Testcases:
 - schedule cron with id
 - schedule cron with alias
 */
export class MakeCron extends BotgartCommand {
    constructor() {
        super("makecron", {
            aliases: ["makecron", "mkcron"],
            quoted: true,
            args: [
                {
                    id: "schedule",
                    type: "string",
                    default: "",
                },
                {
                    id: "cmd",
                    type: "string", // "commandAlias"
                },
                {
                    id: "args",
                    match: "rest",
                },
            ],
            // userPermissions: ["ADMINISTRATOR"]
        });
    }

    async command(message, responsible, guild, args) {
        if (message.member === null || !message.member) {
            return message.author.send(L.get("NOT_AVAILABLE_AS_DM"));
        }

        const schedule = args.schedule;
        const cmd = args.cmd;
        const cmdargs = args.args;

        // we could use commandAlias as type for the mod parameter,
        // but then invalid commands just result in undefined.
        // That doesn't give us the opportunity to give feedback to the user what his faulty command string was.
        // So we look for the command for ourselves from a plain string.
        const mod =
            this.getBotgartClient().commandHandler.modules[cmd] ||
            Array.from(this.getBotgartClient().commandHandler.modules.values()).find((m) => m.aliases.includes(cmd));
        if (!mod) {
            return message.util.send(L.get("NO_SUCH_COMMAND").formatUnicorn(cmd));
        }

        // crons can not schedule other crons for shenanigans-reasons
        if (mod.id == this.id) {
            return message.util.send(L.get("CIRCULAR_CRON"));
        }

        if (!mod.cronable) {
            return message.util.send(L.get("NOT_CRONABLE"));
        }

        return mod.parse(message, cmdargs).then((parsedArgs) => {
            const checkError = mod.checkArgs(parsedArgs);
            if (checkError !== undefined) {
                return message.util.send(checkError);
            } else {
                return this.scheduleAndSave(schedule, message, mod, parsedArgs);
            }
        });
    }

    private async scheduleAndSave(schedule, message: Message, mod, parsedArgs) {
        const cl = this.client as BotgartClient;
        const job = cl.cronJobService.scheduleCronJob(schedule, message.member!.user, message!.guild!, mod, parsedArgs);
        if (!job) {
            return message.util!.send(L.get("CRONJOB_NOT_STORED"));
        } else {
            const cid = cl.cronJobRepository.storeCronJob({
                schedule: schedule,
                command: mod.id,
                arguments: mod.serialiseArgs(parsedArgs),
                created_by: message.member!.user.id,
                guild: message.guild!.id,
            });
            if (cid === undefined) {
                LOG.error(`An error was encountered while storing a cronjob for the command ${mod.name}, the DB returned an undefined ID.`);
            } else {
                cl.cronJobService.scheduledJobs[cid] = job;
                LOG.info("Scheduled new cron of type '{0}' with ID {1}.".formatUnicorn(mod.id, cid));
                return message.util!.send(L.get("CRONJOB_STORED").formatUnicorn(cid, job.nextInvocation()));
            }
            return message.util!.send(L.get("INTERNAL_ERROR"));
        }
    }
}

module.exports = MakeCron;
