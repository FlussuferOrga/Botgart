import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import * as moment from "moment";
import { Achievement } from "./Achievements";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:

*/
export class RevokeAchievement extends BotgartCommand {
     constructor() {
        super("revokeachievement", {
            aliases: ["revokeachievement","rmachievement"],
            split: "quoted",
            args: [
                {
                    id: "achievement",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => {
                        let achievement: number | Achievement = parseInt(word);
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

    checkArgs(args) {
        return args &&
                // there is this super weird behaviour here, where `args.achievement instanceof Achievement` always returns false,
                // although it returns true within the BotgartClient class. I can only come up with the explanation that this has to 
                // do with class loading between the two modules and maybe the fact that achievements are instantiated by reflection. 
                // But anyway, this seems to be the most "sane" sanity check here.
                (args.player !== undefined && args.achievement !== undefined) // proper achievementname + player
                 || Number.isInteger(args.achievement) // achievement entry by DB id
                ? undefined 
                : L.get(this.helptextKey());
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const userdata = this.getBotgartClient().db.getUserByDiscordId(args.player.user);
        if(userdata === undefined && !Number.isInteger(args.achievement)) {
            message.reply(L.get("REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
        } else {
            const revoked = (Number.isInteger(args.achievement))
                ? this.getBotgartClient().db.deletePlayerAchievement(args.achievement)
                : this.getBotgartClient().db.revokePlayerAchievements(args.achievement.name, userdata.gw2account);
            message.reply(L.get("REVOKE_ACHIEVEMENT_SUCCESS", [""+revoked]));
        }

    }
}

module.exports = RevokeAchievement;