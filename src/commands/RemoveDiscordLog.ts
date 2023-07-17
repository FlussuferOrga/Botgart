import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { logger } from "../util/Logging";

const LOG = logger();

/**
 Testcases:

 */
export class RemoveDiscordLog extends BotgartCommand {
    constructor() {
        super(
            "removediscordlog",
            {
                aliases: ["removediscordlog"],
                quoted: true,
                channel: "guild",
                args: [
                    {
                        id: "type",
                        type: "string",
                    },
                    {
                        id: "channel",
                        type: (message: discord.Message | undefined, phrase?: string) =>
                            message?.guild?.channels.cache.find((channel) => channel.name === phrase)?.name ??
                            (message?.channel as discord.TextChannel).name,
                    },
                ],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: false,
            }
        );
    }

    async command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        const textChannel = guild.channels.cache.find((channel) => channel.name === args.channel);
        cl.logChannelRepository.removeLogChannel(guild, args.type, textChannel);
        LOG.info("Removed log channel '{0}' for event type '{1}' in guild '{2}'.".formatUnicorn(textChannel.name, args.type, guild.name));
        if (message) {
            await message.react("✅"); // that's a white checkmark, even if not rendered properly...
        }
        const types: string[] = await cl.logChannelRepository.getLogTypes(guild, textChannel);
        const desc = "** '{0}' CHANNEL TYPES:**\n\n".formatUnicorn(textChannel.name).concat(types.join("\n"));
        await message.reply(desc);
    }
}

module.exports = RemoveDiscordLog;
