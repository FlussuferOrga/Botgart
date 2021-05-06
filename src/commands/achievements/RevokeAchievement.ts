import * as discord from "discord.js";
import { Achievement } from "../../achievements/Achievement";
import { BotgartCommand } from "../../BotgartCommand";
import { getConfig } from "../../config/Config";
import * as L from "../../Locale";
import { logger } from "../../util/Logging";

const LOG = logger();

type AchievementArg = number | Achievement<unknown> | undefined;

/**
 Testcases:

 */
export class RevokeAchievement extends BotgartCommand {
    constructor() {
        super("revokeachievement", {
                aliases: ["revokeachievement", "rmachievement"],
                quoted: true,
                args: [
                    {
                        id: "achievement",
                        type: (message: discord.Message, phrase: string): AchievementArg => {
                            let achievement: AchievementArg = parseInt(phrase);
                            if (isNaN(achievement)) {
                                achievement = this.getBotgartClient().achievementRegistry.getAchievement(phrase);
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
            {
                enabled: getConfig().get().achievements.enabled,
            }
        );
    }

    checkArgs(args) {
        return args &&
        // there is this super weird behaviour here, where `args.achievement instanceof Achievement` always returns false,
        // although it returns true within the BotgartClient class. I can only come up with the explanation that this has to
        // do with class loading between the two modules and maybe the fact that achievements are instantiated by reflection.
        // But anyway, this seems to be the most "sane" sanity check here.
        args.achievement && args.player || Number.isInteger(args.achievement) // proper achievementname + player OR DB ID
            ? undefined
            : L.get(this.helptextKey());
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: { achievement: AchievementArg, player?: discord.GuildMember }): Promise<void> {
        // note that args.achievement is not typed Achievement|number on purpose, as it would prevent stuff like
        // Number.isInteger(args.achievement) (which only takes number as argument) and would make the code a whole lot more clunky
        // for very little benefit.
        const repo = this.getBotgartClient().achievementRepository;
        const registrationRepository = this.getBotgartClient().registrationRepository;
        let userdata = args.player ? registrationRepository.getUserByDiscordId(args.player.user) : undefined;
        if (userdata === undefined && !Number.isInteger(args.achievement)) {
            message.reply(L.get("REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
        } else {
            let revokedCount = 0;
            if (Number.isInteger(args.achievement)) {
                // revoke specific instance
                const achievementId: number = args.achievement as number;
                const achievementData = repo.deletePlayerAchievement(achievementId);
                if (achievementData !== undefined) {
                    revokedCount = 1; // else stays at default 0
                    const registry = this.getBotgartClient().achievementRegistry;
                    const aobj: Achievement<never> | undefined = registry.getAchievement(achievementData.achievement_name);
                    if (aobj !== undefined && achievementData && repo.checkAchievement(achievementData.achievement_name, achievementData.gw2account).length == 0) {
                        // user lost their last instance of this achievement -> remove role
                        // since removing an entry from the DB does not require a player to be passed,
                        // we need to resolve the player manually
                        userdata = registrationRepository.getUserByGW2Account(achievementData.gw2account);
                        if (userdata) {
                            const member = await guild.members.fetch(userdata.user); // cache.find(m => m.id === userdata.user);
                            if (member) {
                                guild.roles.cache.filter(r => r.name === aobj.getRoleName())
                                    .forEach(r => member.roles.remove(r));
                            }
                        }
                    }
                }
            } else if (typeof args.achievement !== "undefined" && typeof args.achievement !== "number") {
                const achievement = args.achievement;
                // revoke all instances
                // assert args.achievement instanceof Achievement
                if (userdata === undefined) {
                    LOG.error(`Should have revoked Achievement instance ${achievement.name} from a user which was not successfully determined.`);
                    message.reply(L.get("REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
                } else {
                    revokedCount = repo.revokePlayerAchievements(args.achievement.name, userdata.gw2account);
                    const role: discord.Role | undefined = guild.roles.cache.find(r => r.name === achievement.getRoleName());
                    if (role !== undefined) {
                        args.player?.roles.remove(role);
                    }
                }
            }
            message.reply(L.get("REVOKE_ACHIEVEMENT_SUCCESS", ["" + revokedCount]));
        }
    }

}

module.exports = RevokeAchievement;