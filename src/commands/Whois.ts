import * as discord from "discord.js";
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

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): Promise<void> {
        const name = args.name.toLowerCase(); // JS string#search allows RegExps, so we need to escape the popular "[]" for guild tags and so on
        const namedEscaped = U.escapeRegExp(name);
        const res = await this.query(guild, namedEscaped, name);
        if (res.length === 0) {
            await this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        } else {
            await this.reply(message, responsible, L.get("WHOIS_RESULTS"));

            let chunk = "\u200B";
            // output result
            for (let queryResult of res) {
                const response = "{0} | {1} | {2}".formatUnicorn(
                    queryResult.member?.toString(),
                    Whois.backticksIfNotEmpty(queryResult.member?.user.tag),
                    Whois.backticksIfNotEmpty(queryResult?.account_name)
                );

                let nextChunk = chunk + "\n" + response
                if (nextChunk.length >= 2000) {
                    // chunk would be too big -> send and prepare new chunk
                    await this.reply(message, responsible, chunk);
                    chunk = "\u200B"
                }
                chunk = nextChunk
            }
            if (chunk.length > 0) {
                await this.reply(message, responsible, chunk);
            }
        }
    }

    private async query(guild: discord.Guild, namedEscaped: string, name: string) {
        const members = await guild.members.fetch()
        const matchingDiscordMembers = members
            .filter(m => m.displayName.toLowerCase().search(namedEscaped) > -1 || m.user.tag.toLowerCase().search(namedEscaped) > -1)
            .map(value => value.user.id)

        const res = this.getBotgartClient().registrationRepository.whois(name, matchingDiscordMembers);

        //map members
        const enhancedResult = await Promise.all(res.map(async value => ({
            ...value, member: await guild.members.cache.get(value.discord_id)
        })));

        // sort and return
        return enhancedResult.sort((a, b) => {
            return Whois.compareStringSafe(a.member?.nickname, b.member?.nickname)
                || Whois.compareStringSafe(a.member?.client?.user?.tag, b.member?.client?.user?.tag)
                || Whois.compareStringSafe(a.account_name, b.account_name)
        })
    }

    private static compareStringSafe(a: string | null | undefined, b: string | null | undefined) {
        return (a || b) ? (!a ? -1 : !b ? 1 : a.localeCompare(b)) : 0;
    }

    private static backticksIfNotEmpty(value: string | undefined) {
        return value ? `\`${value}\`` : "*None*";
    }
}

module.exports = Whois;