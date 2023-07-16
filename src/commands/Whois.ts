import { Argument } from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";
import * as U from "../util/Util";

/**
 Testcases:
 */

export class Whois extends BotgartCommand {
    constructor() {
        super("whois", {
            aliases: ["whois"],
            channel: "guild",
            args: [
                {
                    id: "name",
                    type: Argument.union("memberMention", "string"),
                },
            ],
        });
    }

    checkArgs(args) {
        return !args?.name || args.name.length < 3 ? L.get("HELPTEXT_WHOIS") : undefined;
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        let res: { account_name?: string; member?: discord.GuildMember; user: string }[];

        if (args?.name instanceof discord.GuildMember) {
            res = await this.queryUser(args.name);
        } else {
            const name = args.name.toLowerCase(); // JS string#search allows RegExps, so we need to escape the popular "[]" for guild tags and so on
            const namedEscaped = U.escapeRegExp(name);
            res = await this.query(guild, namedEscaped, name);
        }

        if (res.length === 0) {
            await this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        } else {
            await this.reply(
                message,
                responsible,
                L.get("WHOIS_RESULTS", [], "\n") + "\n\n@Mention | (D) Id | (D) Tag | (D) Nickname | (GW) Account"
            );

            let chunk = "\u200B";
            for (const queryResult of res) {
                // output result
                const response = "{0}{1} | {2} | {3} | {4} | {5}".formatUnicorn(
                    queryResult.member?.toString(),
                    queryResult.member?.user?.bot ? " :robot:" : "",
                    Whois.backticksIfNotEmpty(queryResult.member?.id),
                    Whois.backticksIfNotEmpty(queryResult.member?.user?.tag),
                    Whois.backticksIfNotEmpty(queryResult.member?.nickname),
                    Whois.backticksIfNotEmpty(queryResult?.account_name)
                );

                const nextChunk = chunk + "\n" + response;
                if (nextChunk.length >= 2000) {
                    // chunk would be too big -> send and prepare new chunk
                    await this.reply(message, responsible, chunk);
                    chunk = "\u200B";
                }
                chunk = nextChunk;
            }
            if (chunk.length > 0) {
                await this.reply(message, responsible, chunk);
            }
        }
    }

    private static matches(m: discord.GuildMember, needle: string): boolean {
        function nicknameMatches() {
            return (m.nickname?.toLowerCase() ?? "").search(needle) > -1;
        }

        function usernameMatches() {
            return m.user.username.toLowerCase().search(needle) > -1;
        }

        function tagMatches() {
            return m.user.tag.toLowerCase().search(needle) > -1;
        }

        function idMatches() {
            return m.id.search(needle) > -1;
        }

        return nicknameMatches() || usernameMatches() || tagMatches() || idMatches();
    }

    private async query(guild: discord.Guild, namedEscaped: string, name: string) {
        const members = await guild.members.fetch();

        const matchingDiscordMembers = members.filter((member) => Whois.matches(member, namedEscaped)).map((value) => value.user.id);

        const res = await this.getBotgartClient().registrationRepository.whois(name, guild.id, matchingDiscordMembers);

        // map members
        const enhancedResult = await Promise.all(
            res.map(async (value) => ({
                ...value,
                member: await guild.members.fetch(value.user),
            }))
        );

        return this.sort(enhancedResult);
    }

    private sort(
        enhancedResult: {
            account_name?: string;
            member: discord.GuildMember | undefined;
            user: string;
        }[]
    ) {
        // sort and return
        return enhancedResult.sort(
            (a, b) =>
                Whois.compareStringSafe(a.member?.nickname, b.member?.nickname) ||
                Whois.compareStringSafe(a.member?.client?.user?.tag, b.member?.client?.user?.tag) ||
                Whois.compareStringSafe(a.account_name, b.account_name)
        );
    }

    private static compareStringSafe(a: string | null | undefined, b: string | null | undefined) {
        // eslint-disable-next-line no-nested-ternary
        return a || b ? (!a ? -1 : !b ? 1 : a.localeCompare(b)) : 0;
    }

    private static backticksIfNotEmpty(value: string | undefined | null) {
        return value ? `\`${value}\`` : "*None*";
    }

    private async queryUser(member: discord.GuildMember) {
        const user = await this.getBotgartClient().registrationRepository.getUserByDiscordId(member.user);
        return [
            {
                user: member.id,
                member: member,
                account_name: user?.account_name,
            },
        ];
    }
}

module.exports = Whois;
