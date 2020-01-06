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

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: {achievement: any, player?: discord.GuildMember}): void {
        // note that args.achievement is not typed Achievement|number on purpose, as it would prevent stuff like 
        // Number.isInteger(args.achievement) (which only takes number as argument) and would make the code a whole lot more clunky
        // for very little benefit.
        const db = this.getBotgartClient().db;
        let userdata = args.player ? db.getUserByDiscordId(args.player.user) : undefined;
        if(userdata === undefined && !Number.isInteger(args.achievement)) {
            message.reply(L.get("REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
        } else {
            let revokedCount = 0;
            if (Number.isInteger(args.achievement)) {
                // revoke specific instance
                const achievementId: number = <number>args.achievement;
                const achievementData = db.deletePlayerAchievement(achievementId);
                if(achievementData !== undefined) {
                    revokedCount = 1; // else stays at default 0
                    const aobj: Achievement = this.getBotgartClient().getAchievement(achievementData.achievement_name);
                    if(achievementData && db.checkAchievement(achievementData.achievement_name, achievementData.gw2account).length == 0) {
                        // user lost their last instance of this achievement -> remove role
                        // since removing an entry from the DB does not require a player to be passed,
                        // we need to resolve the player manually
                        userdata = db.getUserByGW2Account(achievementData.gw2account);
                        if(userdata) {
                            const member = guild.members.find(m => m.id === userdata.user);
                            const role: discord.Role = guild.roles.find(r => r.name === aobj.getRoleName());
                            if(member && role) {
                                member.removeRole(role);
                            }    
                        }                    
                    }
                }
            } else {
                // revoke all instances
                // assert args.achievement instanceof Achievement
                revokedCount = db.revokePlayerAchievements(args.achievement.name, userdata.gw2account);
                const role: discord.Role = guild.roles.find(r => r.name === args.achievement.getRoleName());
                if(role) {
                    args.player.removeRole(role);
                }
            }
            message.reply(L.get("REVOKE_ACHIEVEMENT_SUCCESS", [""+revokedCount]));
        }
    }
}

module.exports = RevokeAchievement;