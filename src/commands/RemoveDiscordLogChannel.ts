import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { log } from "../Util";
import { TextChannel } from "discord.js";

/**
Testcases:

*/
export class RemoveDiscordLog extends BotgartCommand {
    constructor() {
        super("removediscordlog", {
                aliases: ["removediscordlog"],
                quoted: true,
                args: [
                    {
                        id: "type",
                        type: "string"
                    },
                    {
                        id: "channel",
                        type: (message: discord.Message | undefined, phrase?: string) => message?.guild?.channels.cache.find(channel => channel.name === phrase)?.name
                                                                  ?? (message?.channel as discord.TextChannel).name
                    }
                    
                ],
                userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: false,
                availableAsDM: false
            }
        );
    }

    command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        let textChannel : TextChannel; 
        textChannel = guild.channels.cache.find(channel => channel.name === args.channel)
        cl.logChannelRepository.removeLogChannel(guild, args.type, textChannel);
        log("notice", "Removed log channel '{0}' for event type '{1}' in guild '{2}'.".formatUnicorn(textChannel.name, args.type, guild.name));
        (<discord.Message>message).react("✅"); // that's a white checkmark, even if not rendered properly...
        let types : string[] = cl.logChannelRepository.getLogTypes(guild, textChannel);
        const desc = "** '{0}' CHANNEL TYPES:**\n\n".formatUnicorn(textChannel.name) .concat( types.join("\n"));
        message.reply(desc);
    }
}

module.exports = RemoveDiscordLog;