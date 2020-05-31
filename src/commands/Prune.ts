import { Command } from "discord-akairo";
import * as Util from "../Util";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:

*/

export class Prune extends BotgartCommand {
    private static readonly LOG_TYPE_AUTH : string = "auth";

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
        return !args || args.days === undefined || args.days < 1 || args.days > 30 ?  L.get(this.helptextKey()) : undefined;
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): Promise<string | void> {
        return guild.members.prune({days: args.days, dry: false, reason: args.message})
          .then(pruned => {
              let mes: string = "{0} members have been pruned after being inactive without role for at least {1} days.".formatUnicorn(pruned, args.days);
              Util.log("info", "Prune.js", "{0} members have been pruned after being inactive without role for at least {1} days.".formatUnicorn(pruned, args.days))
              return mes;
          })
          .catch(e => { 
              Util.log("error", "Prune.js", e.message);
              return "An error occurred while pruning: {0}".formatUnicorn(e.message);
          });
    }

    postExecHook(message: discord.Message, args: Object, result: Promise<string>): any {
        return result.then(m => message.util.send(m)).catch(console.error);
    }
}

module.exports = Prune;
