import * as discord from "discord.js";
import { Util } from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import { getConfig } from "../../config/Config";

/**
 Testcases:

 */
export class ListAchievements extends BotgartCommand {
    constructor() {
        super("listachievements", {
                aliases: ["listachievements", "lsachievements"],
                quoted: true,
                args: []
            },
            {
                availableAsDM: true,
                enabled: getConfig().get().achievements.enabled,
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, unknown>): Promise<void> {
        const text = this.getBotgartClient().achievementRegistry.getAchievements()
            .map(a => `\`${a.name}\`: ${a.getDescription()}`)
            .join("\n");

        for (const split of Util.splitMessage(text, { prepend: "_ _\n" })) {
            await message.reply(split);
        }
    }
}

module.exports = ListAchievements;