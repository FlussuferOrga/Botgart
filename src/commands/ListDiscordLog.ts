import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";

/**
 Testcases:

 */
export class ListDiscordLog extends BotgartCommand {
    constructor() {
        super(
            "listdiscordlog",
            {
                aliases: ["listdiscordlog"],
                quoted: true,
                channel: "guild",
                args: [
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
                cronable: false
            }
        );
    }

    async command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        const textChannel: discord.TextChannel = guild.channels.cache.find((channel) => channel.name === args.channel);
        const types: string[] = await cl.logChannelRepository.getLogTypes(guild, textChannel);
        const desc = "** '{0}' CHANNEL TYPES:**\n\n".formatUnicorn(textChannel.name).concat(types.join("\n"));
        message.reply(desc);
    }
}

module.exports = ListDiscordLog;
