import { Argument } from "discord-akairo";
import * as discord from "discord.js";
import { GuildMember } from "discord.js";
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
                        type: Argument.union("member", "string")
                    }
                ],
            }
        );
    }

    checkArgs(args) {
        return !args || !args.name || args.name.length < 3 ? L.get("HELPTEXT_WHOIS") : undefined;
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): Promise<void> {

        let res: { account_name: string; member: any; discord_id: string }[];

        if (args?.name?.constructor?.name == "GuildMember") {
            res = await this.queryUser(args.name);
        } else {
            const name = args.name.toLowerCase(); // JS string#search allows RegExps, so we need to escape the popular "[]" for guild tags and so on
            const namedEscaped = U.escapeRegExp(name);
            res = await this.query(guild, namedEscaped, name);
        }


        if (res.length === 0) {
            await this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        } else {
            await this.reply(message, responsible, L.get("WHOIS_RESULTS", [], "\n")
                + "\n\n" + "@Mention | (D) Id | (D) Tag | (D) Nickname | (GW) Account");

            let chunk = "\u200B";
            for (let queryResult of res) {
                // output result
                const response = "{0} | {1} | {2} | {3} | {4}"
                    .formatUnicorn(
                        queryResult.member?.toString(),
                        Whois.backticksIfNotEmpty(queryResult.member?.id),
                        Whois.backticksIfNotEmpty(queryResult.member?.user?.tag),
                        Whois.backticksIfNotEmpty(queryResult.member?.nickname),
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
            .filter(m => {
                return (m.nickname ? m.nickname?.toLowerCase() : "").search(namedEscaped) > 1
                    || m.user.username.toLowerCase().search(namedEscaped) > -1
                    || m.user.tag.toLowerCase().search(namedEscaped) > -1
                    || m.id.search(namedEscaped) > -1;
            })
            .map(value => value.user.id)

        const res = this.getBotgartClient().registrationRepository.whois(name, matchingDiscordMembers);

        //map members
        const enhancedResult = await Promise.all(res.map(async value => ({
            ...value, member: await guild.members.cache.get(value.discord_id)
        })));

        return this.sort(enhancedResult);
    }

    private sort(enhancedResult: { account_name: string; member: any; discord_id: string }[]) {
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

    private static backticksIfNotEmpty(value: string | undefined | null) {
        return value ? `\`${value}\`` : "*None*";
    }

    private async queryUser(member: discord.GuildMember) {
        const user = this.getBotgartClient().registrationRepository.getUserByDiscordId(member.user);
        return [{
            discord_id: member.id,
            member: member,
            account_name: user?.account_name
        }];
    }
}

module.exports = Whois;