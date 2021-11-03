import * as discord from "discord.js";
import * as moment from "moment";
import { Achievement, AchievementAwardResult } from "../../achievements/Achievement";
import { BotgartCommand } from "../../BotgartCommand";
import { getConfig } from "../../config/Config";
import * as L from "../../Locale";

/**
 Testcases:

 */
export class AwardAchievement extends BotgartCommand {
    constructor() {
        super("awardachievement", {
                aliases: ["awardachievement", "grantachievement"],
                quoted: true,
                args: [
                    {
                        id: "achievement",
                        type: (message: discord.Message, phrase: string) =>
                            this.getBotgartClient().achievementRegistry.getAchievement(phrase)
                    },
                    {
                        id: "player",
                        type: "member"
                    },
                    {
                        id: "timestamp",
                        type: (message: discord.Message, phrase: string) => moment.utc(phrase),
                        default: moment.utc()
                    }
                ]
            },
            {
                enabled: getConfig().get().achievements.enabled,
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: { achievement: Achievement<unknown>; player: discord.GuildMember; timestamp?: moment.Moment }): Promise<void> {
        if (args.achievement === undefined) {
            message.reply(L.get("NO_SUCH_ACHIEVEMENT"));
        } else {
            const res = args.achievement.awardIn(message.guild as discord.Guild, args.player, responsible.id);
            switch (res) {
                case AchievementAwardResult.AWARDED_FIRST_TIME:
                    message.reply(L.get("AWARD_ACHIEVEMENT_SUCCESS_FIRST_TIME"));
                    break;
                case AchievementAwardResult.AWARDED_AGAIN:
                    message.reply(L.get("AWARD_ACHIEVEMENT_SUCCESS_AGAIN"));
                    break;
                case AchievementAwardResult.NOT_AWARDED:
                    message.reply(L.get("AWARD_ACHIEVEMENT_FAILED_NOT_AWARDED"));
                    break;
                case AchievementAwardResult.USER_NOT_FOUND:
                    message.reply(L.get("AWARD_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
                    break;
                case AchievementAwardResult.HIDDEN:
                    message.reply(L.get("AWARD_ACHIEVEMENT_FAILED_USER_HIDDEN"));
                    break;
            }
        }
    }
}

module.exports = AwardAchievement;