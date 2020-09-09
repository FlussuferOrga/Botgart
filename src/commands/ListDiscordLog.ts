import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { log } from "../Util";
import { TextChannel } from "discord.js";

/**
Testcases:

*/
export class ListDiscordLog extends BotgartCommand {
    constructor() {
        super("listdiscordlog", {
                aliases: ["listdiscordlog"],
                quoted: true,
                args: [
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
        let types : string[] = cl.logChannelRepository.getLogTypes(guild, textChannel);
        const desc = "** '{0}' CHANNEL TYPES:**\n\n".formatUnicorn(textChannel.name) .concat( types.join("\n"));
        message.reply(desc);
    }
}

module.exports = ListDiscordLog;