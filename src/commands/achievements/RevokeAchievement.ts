import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import * as moment from "moment";
import * as achievement from "./Achievements";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:

*/
export class AwardAchievement extends BotgartCommand {
     constructor() {
        super("rewardachievement", {
            aliases: ["rewardachievement","rmachievement"],
            split: "quoted",
            args: [
                {
                    id: "achievement",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => {
                        let achievement: number | achievement.Achievement = parseInt(word);
                        if(isNaN(achievement)) {
                            achievement = this.getBotgartClient().getAchievement(word);
                        }
                        return achievement;
                    }
                },
                {
                    id: "player",
                    type: "member"
                },
                
            ]
        },
        false,  // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_REVOKE_ACHIEVEMENT");
    }

    checkArgs(args) {
        return !args || 
                !(
                    (args.player !== undefined && (args.achievement instanceof achievement.Achievement)) // proper achievementname + player
                    || Number.isInteger(args.achievement) // achievement entry by DB id
                )
                ? L.get("HELPTEXT_REVOKE_ACHIEVEMENT") 
                : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(Number.isInteger(args.achievement)) {
            console.log("NUMBER");
        } else if(args.achievement instanceof achievement.Achievement) {
            console.log("ACHIEVEMENT");
        } else {
            console.log("ERROR!!");
        }
    }
}

module.exports = AwardAchievement;