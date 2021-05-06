import * as discord from "discord.js";
import { Achievement } from "../../achievements/Achievement";
import { BotgartCommand } from "../../BotgartCommand";
import { getConfig } from "../../config/Config";
import * as L from "../../Locale";
import { Registration } from "../../repositories/RegistrationRepository";
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
            ? undefined : L.get(this.helptextKey());
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: { achievement: AchievementArg, player?: discord.GuildMember }): Promise<void> {
        // note that args.achievement is not typed Achievement|number on purpose, as it would prevent stuff like
        // Number.isInteger(args.achievement) (which only takes number as argument) and would make the code a whole lot more clunky
        // for very little benefit.
        const registrationRepository = this.getBotgartClient().registrationRepository;
        const userdata = args.player ? registrationRepository.getUserByDiscordId(args.player.user) : undefined;
        if (userdata === undefined && !Number.isInteger(args.achievement)) {
            message.reply(L.get("REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
        } else {
            await this.revoke(args, userdata, guild, message);
        }
    }

    private async revoke(args: { achievement: AchievementArg; player?: discord.GuildMember },
                         userdata: Registration | undefined,
                         guild: discord.Guild,
                         message: discord.Message) {
        let revokedCount = 0;
        if (Number.isInteger(args.achievement)) {
            // revoke specific instance
            revokedCount = await this.revokeInstance(guild, args.achievement as number);
        } else if (typeof args.achievement !== "undefined" && typeof args.achievement !== "number") {
            const achievement = args.achievement;
            const player = args.player;
            // revoke all instances
            // assert args.achievement instanceof Achievement
            revokedCount = await this.revoleAllInstances(userdata, achievement, message, guild, player);
        }
        message.reply(L.get("REVOKE_ACHIEVEMENT_SUCCESS", ["" + revokedCount]));
        return userdata;
    }

    private async revoleAllInstances(
        userdata: Registration | undefined,
        achievement: Achievement<unknown>,
        message: discord.Message,
        guild: discord.Guild,
        player?: discord.GuildMember): Promise<number> {
        let revokedCount = 0;
        if (userdata === undefined) {
            LOG.error(`Should have revoked Achievement instance ${achievement.name} from a user which was not successfully determined.`);
            message.reply(L.get("REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND"));
        } else {
            revokedCount = this.getBotgartClient().achievementRepository.revokePlayerAchievements(achievement.name, userdata.gw2account);
            const role: discord.Role | undefined = guild.roles.cache.find(r => r.name === achievement.getRoleName());
            if (role !== undefined) {
                player?.roles.remove(role);
            }
        }
        return revokedCount;
    }

    private async revokeInstance(guild: discord.Guild, achievementId: number): Promise<number> {
        const repo = this.getBotgartClient().achievementRepository;
        const registrationRepository = this.getBotgartClient().registrationRepository;

        const achievementData = repo.deletePlayerAchievement(achievementId);
        if (achievementData !== undefined) {
            const registry = this.getBotgartClient().achievementRegistry;
            const aobj: Achievement<never> | undefined = registry.getAchievement(achievementData.achievement_name);
            if (aobj !== undefined && achievementData && repo.checkAchievement(achievementData.achievement_name, achievementData.gw2account).length == 0) {
                // user lost their last instance of this achievement -> remove role
                // since removing an entry from the DB does not require a player to be passed,
                // we need to resolve the player manually
                const user = registrationRepository.getUserByGW2Account(achievementData.gw2account);
                if (user) {
                    const member = await guild.members.fetch(user.user); // cache.find(m => m.id === userdata.user);
                    if (member) {
                        guild.roles.cache.filter(r => r.name === aobj.getRoleName())
                            .forEach(r => member.roles.remove(r));
                    }
                }
            }
            return 1;
        }
        return 0;
    }
}

module.exports = RevokeAchievement;