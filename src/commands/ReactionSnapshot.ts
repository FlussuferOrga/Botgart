import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { BotgartClient } from "../BotgartClient";

/**
Testcases:

*/
export class ReactionSnapshot extends BotgartCommand {
    constructor() {
        super("reactionsnapshot", {
            aliases: ["reactionsnapshot"],
            quoted: true,
            args: [
                {
                    id: "message",
                    type: async (message: discord.Message, phrase: string) => { 
                        let mes: discord.Message = null;
                        const match = phrase.match(/^https:\/\/discordapp.com\/channels\/(\d+)\/(\d+)\/(\d+)$/)
                        if(match !== null) {
                            const [_, guildId, channelId, messageId] = match;
                            const cl: BotgartClient = this.getBotgartClient();

                            const guild: discord.Guild = cl.guilds.cache.find(g => g.id === guildId);
                            if(guild !== null) {
                                const channel: discord.TextChannel = <discord.TextChannel>guild.channels.cache.find(c => c instanceof discord.TextChannel && c.id === channelId);
                                if(channel !== null) {
                                    mes = await channel.messages.fetch(messageId).catch(er => null);
                                }
                            }
                        }
                        return mes;
                    }
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        },
        {
            cronable: true
        }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): Promise<void> {
        const listings = [];
        for(const [k, reaction] of (<discord.Message>args.message).reactions.cache.sort((r1,r2) => r2.count - r1.count)) {
            const users = await reaction.users.fetch();
            listings.push(`**${reaction.emoji.name} (${reaction.count})**\n${users.map(u => `${u.username} (<@${u.id}>) `).join("\n")}`)
        }
        message.reply("\n" + listings.join("\n\n"), {split: true});
    }
}

module.exports = ReactionSnapshot;