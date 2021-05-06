import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { logger } from "../util/Logging";

const LOG = logger();

/**
 Testcases:
 - missing parameters -> error
 - regular say -> bot posts text
 - with invalid channel -> error
 - from cron: remove channel bot was supposed to talk in -> error
 */
export class Say extends BotgartCommand {
    constructor() {
        super("say", {
                aliases: ["say", "speak"],
                quoted: true,
                args: [
                    {
                        id: "channel",
                        type: "textChannel"
                    },
                    {
                        id: "text",
                        type: "string"
                    }
                ]
            },
            {
                cronable: true
            }
        );
    }

    command(message, responsible, guild, args) {
        // Note that this callback could take place long after the cron was scheduled.
        // So the bot could no longer be there. We therefore need to find() the guild
        // again to make sure the bot is still on there.
        let result;
        const g = this.client.guilds.cache.find(g => g.id == guild.id);
        if (!g) {
            LOG.error("I am not a member of guild {0}.".formatUnicorn(guild.id));
            result = false;
        } else {
            const c: discord.TextChannel = g.channels.cache
                .find(c => c.id == args.channel.id && c instanceof discord.TextChannel) as discord.TextChannel;
            if (!c) {
                LOG.error("Can not find a channel {0}.".formatUnicorn(args.channel.id));
                result = false;
            } else {
                c.send(args.text);
                LOG.info("Executed Say.");
                result = true;
            }
        }
        return result;
    }

    serialiseArgs(args) {
        const clone = Object.assign({}, args);
        clone.channel = { guild: args.channel.guild.id, channel: args.channel.id };
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        const args = JSON.parse(jsonargs);
        const guild = this.client.guilds.cache.find(g => g.id == args.channel.guild);
        args.channel = guild?.channels.cache.find(c => c.id == args.channel.channel);
        return args;
    }
}

module.exports = Say;