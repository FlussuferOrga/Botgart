import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import * as L from "../Locale.js";
import { logger } from "../util/Logging.js";

const LOG = logger();

/**
 Testcases:
 - missing parameters -> error
 - proper parameters -> poll is created
 - invalid channel -> error
 - empty question -> error?
 - emotes string doesn't contain proper emotes -> error
 - cron: everything of the above
 */
export default class Poll extends BotgartCommand {
    constructor() {
        super(
            "poll",
            {
                aliases: ["poll", "vote"],
                quoted: true,
                channel: "guild",
                args: [
                    {
                        id: "channel",
                        type: "textChannel",
                    },
                    {
                        id: "question",
                        type: "string",
                    },
                    {
                        id: "emotes",
                        // type: "string"
                        type: (message: discord.Message, emotes: string) => (emotes ? emotes.split(" ") : []),
                    },
                ],
            },
            {
                cronable: true,
            }
        );
    }

    checkArgs(args) {
        return !args?.channel || !args.question || !args.emotes || args.emotes.length < 1 ? L.get(this.helptextKey()) : undefined;
    }

    serialiseArgs(args) {
        const clone = { ...args };
        clone.channel = { guild: args.channel.guild.id, channel: args.channel.id };
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        const args = JSON.parse(jsonargs);
        const guild = this.client.guilds.cache.find((g) => g.id == args.channel.guild);
        args.channel = guild?.channels.cache.find((c) => c.id == args.channel.channel);
        return args;
    }

    async command(message, responsible, guild, args) {
        await args.channel.send(args.question).then((m) => {
            // filter empty strings out beforehand
            args.emotes
                .filter((react) => react)
                .forEach((react) => {
                    // works for standard emotes, like ":D" etc
                    m.react(react).catch((_) => {
                        const reg = /<a?:[a-zA-Z0-9_]+:(\d+)>/;
                        const match = react.match(reg);
                        const customEmote = match ? args.channel.guild.emojis.cache.find((e) => e.id === match[1]) : undefined;

                        // could still be garbage or from another server -> just ignore it in that case
                        if (customEmote) {
                            m.react(customEmote);
                        }
                    });
                });
        });
        LOG.info("Created poll '{0}'.".formatUnicorn(args.question));
    }
}
