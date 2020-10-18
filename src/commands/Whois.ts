import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";
import * as U from "../Util";

/**
Testcases:

*/

export class Whois extends BotgartCommand {
    constructor() {
        super("whois", {
            aliases: ["whois"],
            args: [
                {
                    id: "name",
                    type: "string"
                }
            ],
        }
        );
    }

    checkArgs(args) {
        return !args || !args.name || args.name.length < 3 ? L.get("HELPTEXT_WHOIS") : undefined;
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const name = args.name.toLowerCase(); // JS string#search allows RegExps, so we need to escape the popular "[]" for guild tags and so on
        const namedEscaped = U.escapeRegExp(name);
        const res = (<BotgartClient>this.client).registrationRepository.whois(name,
                                                          (<discord.Guild>message.guild).members.cache
                                                           .filter(m => m.displayName.toLowerCase().search(namedEscaped) > -1)
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

module.exports = Whois;