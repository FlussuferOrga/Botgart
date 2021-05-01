import { Listener } from "discord-akairo";
import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import { logger } from "../Logging";

const LOG = logger();

export class IgnoringRolesListener extends Listener {
    constructor() {
        super("IgnoringRolesListener", {
            emitter: "client",
            event: "guildMemberUpdate"
        });
    }

    exec(oldMember: discord.GuildMember, newMember: discord.GuildMember) {
        const oldRoles = oldMember.roles.cache.map(r => r.name);
        const newRoles: discord.Role[] = newMember.roles.cache.filter(r => !oldRoles.includes(r.name)).array();
        const ignoringRoles = newRoles.filter(r => getConfig().get().achievements.ignoring_roles.includes(r.name));
        if(ignoringRoles.length > 0) {
            const client = <BotgartClient>this.client;
            const userdata = client.registrationRepository.getUserByDiscordId(newMember.user);
            let deletedLeads = 0;
            let revokedAchievements = 0;
            for(const achievement of client.achievementRegistry.getAchievements()) {
                const role: discord.Role | undefined = newMember.guild.roles.cache.find(r => r.name === achievement.getRoleName());
                if(role === undefined) {
                    LOG.log("warning", `Could not find a role ${achievement.getRoleName()} on server ${newMember.guild.name} to remove when user ${newMember.displayName} chose to ignore achievement roles.`)
                } else {
                    newMember.roles.remove(role);
                }
            }
            if(userdata) {
                [deletedLeads, revokedAchievements] = client.achievementRepository.deleteAchievementInformation(userdata.gw2account);
            }
            LOG.log("info", `Player ${newMember.displayName} assigned themselves an achievement ignoring role(s) ${ignoringRoles.map(r => r.name)}. Revoked ${revokedAchievements} achievements and all information about ${deletedLeads} leads from the DB.`)
        }
    }
}

module.exports = IgnoringRolesListener;