import { Command } from "discord-akairo";
import { log } from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { BotgartClient } from "../BotgartClient";

/**
Testcases:

*/
export class WhoisCommand extends BotgartCommand {
    constructor() {
        super("whois", {
            aliases: ["whois"],
            args: [
                {
                    id: "name",
                    type: "string"
                }
            ],
        },
        false, // available per DM
        true, // cronable
        0 // everyone permission
        );
    }

    desc(): string {
        return L.get("DESC_WHOIS");
    }

    checkArgs(args) {
        return !args || !args.name || args.name.length < 3 ? L.get("HELPTEXT_WHOIS") : undefined;
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const name = args.name.toLowerCase();
        const res = (<BotgartClient>this.client).db.whois(name, 
                                                          message.guild.members.filter(m => m.displayName.toLowerCase().search(name) > -1)
                                                                               .map(m => m.user));
        if(res.length === 0) {
            this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        } else {
            this.reply(message, responsible, L.get("WHOIS_RESULTS"));
            res.forEach(r => 
                this.reply(message, responsible, "<@{0}> | `{1}`".formatUnicorn(r.discord_user, r.account_name))
            );
        }
    }
}

module.exports = WhoisCommand;