import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";
import { logger } from "../util/Logging";

const LOG = logger();

/**
 Testcases:

 */

export class Prune extends BotgartCommand {
    constructor() {
        super("prune", {
                aliases: ["prune"],
                args: [
                    {
                        id: "days",
                        type: "integer",
                        default: -1
                    },
                    {
                        id: "message",
                        type: "string",
                        default: ""
                    }
                ]
            },
            {
                cronable: true
            }
        );
    }

    checkArgs(args) {
        return !args || args.days === undefined || args.days < 1 || args.days > 30 ? L.get(this.helptextKey()) : undefined;
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<string | void> {
        return guild.members.prune({ days: args.days, dry: false, reason: args.message })
            .then(pruned => {
                const mes: string = "{0} members have been pruned after being inactive without role for at least {1} days.".formatUnicorn(pruned, args.days);
                LOG.info("{0} members have been pruned after being inactive without role for at least {1} days.".formatUnicorn(pruned, args.days));
                return mes;
            })
            .catch(e => {
                LOG.error(e.message);
                return "An error occurred while pruning: {0}".formatUnicorn(e.message);
            });
    }

    postExecHook(message: discord.Message, args: Record<string, unknown>, result): Promise<string | void> {
        return result.then(m => message.util?.send(m)).catch(LOG.error);
    }
}

module.exports = Prune;