import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import * as moment from "moment";
import * as achievements from "./Achievements";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

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
                    type: (message: discord.Message, phrase: string) => this.getBotgartClient().getAchievement(phrase)
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
        false,  // available per DM
        false // cronable
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: {achievement: achievements.Achievement<any>, player: discord.GuildMember, timestamp?: moment.Moment}): void {
        if(args.achievement === undefined) {
            message.reply(L.get("NO_SUCH_ACHIEVEMENT"));
        } else {
            const res = args.achievement.awardIn(message.guild, args.player, responsible.id);
            switch(res) {
                case achievements.AchievementAwardResult.AWARDED_FIRST_TIME:
                    message.reply(L.get("AWARD_ACHIEVEMENT_SUCCESS_FIRST_TIME"));
                break;
                case achievements.AchievementAwardResult.AWARDED_AGAIN:
                    message.reply(L.get("AWARD_ACHIEVEMENT_SUCCESS_AGAIN"));
                break;
                case achievements.AchievementAwardResult.NOT_AWARDED:
                    message.reply(L.get("AWARD_ACHIEVEMENT_FAILED_NOT_AWARDED"));
                break;
                case achievements.AchievementAwardResult.USER_NOT_FOUND:
                    message.reply(L.get("AWARD_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
                break;
                case achievements.AchievementAwardResult.HIDDEN:
                    message.reply(L.get("AWARD_ACHIEVEMENT_FAILED_USER_HIDDEN"));
                break;
            }            
        }
    }
}

module.exports = AwardAchievement;