import * as discord from "discord.js";
import {GuildMember} from "discord.js";
import {BotgartClient} from "../BotgartClient";
import {BotgartCommand} from "../BotgartCommand";
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

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): Promise<void> {
        const name = args.name.toLowerCase(); // JS string#search allows RegExps, so we need to escape the popular "[]" for guild tags and so on
        const namedEscaped = U.escapeRegExp(name);
        let members = (<discord.Guild>message.guild).members.cache
            .filter(m => m.displayName.toLowerCase().search(namedEscaped) > -1 || m.user.tag.toLowerCase().search(namedEscaped) > -1);
        const res = (<BotgartClient>this.client).registrationRepository.whois(name, members.map(m => m.user));
        if (res.length === 0) {
            await this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        } else {
            await this.reply(message, responsible, L.get("WHOIS_RESULTS"));
            for (let r of res) {
                let user: GuildMember | null = await guild.members.fetch(r.discord_user);
                if (user != null) {
                    // with tag shown
                    await this.reply(message, responsible, "{0} | `{1}` | `{2}`".formatUnicorn(user.toString(), user.user.tag, r.account_name));
                } else {
                    // without tag shown
                    await this.reply(message, responsible, "<@{0}> | `{1}`".formatUnicorn(r.discord_user, r.account_name));
                }
            }
        }
    }
}

module.exports = Whois;