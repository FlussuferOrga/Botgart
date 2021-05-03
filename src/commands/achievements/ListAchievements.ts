import * as discord from "discord.js";
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

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, unknown>): void {
        message.reply(this.getBotgartClient().achievementRegistry.getAchievements()
                .map(a => `\`${a.name}\`: ${a.getDescription()}`)
                .join("\n")
            , {"split": true});
    }
}

module.exports = ListAchievements;