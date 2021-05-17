import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

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
                            const match = phrase.match(/^https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)$/);
                            if (match !== null) {
                                const [_, guildId, channelId, messageId] = match;
                                const cl: BotgartClient = this.getBotgartClient();

                                const guild: discord.Guild | undefined = cl.guilds.cache.find(g => g.id === guildId);
                                if (guild !== undefined) {
                                    const channel: discord.TextChannel | undefined = guild.channels.cache
                                        .find(c => c instanceof discord.TextChannel && c.id === channelId) as discord.TextChannel;
                                    if (channel !== undefined) {
                                        return channel.messages.fetch(messageId).catch(er => null);
                                    }
                                }
                            }
                            return null; // yes, I hate this style, but the alternative to have nullable result type that is not-null at some points was equally bad.
                        }
                    }
                ],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: true
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const listings: string[] = [];
        for (const [, reaction] of (args.message as discord.Message).reactions.cache.sort((r1, r2) => (r2.count ?? 0) - (r1.count ?? 0))) {
            const users = await reaction.users.fetch();
            listings.push(`**${reaction.emoji.name} (${reaction.count})**\n${users.map(u => `${u.username} (<@${u.id}>) `).join("\n")}`);
        }
        message.reply("\n" + listings.join("\n\n"), { split: true });
    }
}

module.exports = ReactionSnapshot;