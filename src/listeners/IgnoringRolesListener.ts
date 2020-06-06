import {configuration} from "../Config";
import {Listener} from "discord-akairo";
import * as discord from "discord.js";
import {BotgartClient} from "../BotgartClient";
import * as U from "../Util.js";

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
        const ignoringRoles = newRoles.filter(r => configuration.get().achievements.ignoring_roles.includes(r.name));
        if(ignoringRoles.length > 0) {
            const client = <BotgartClient>this.client;
            const userdata = client.db.getUserByDiscordId(newMember.user);
            let deletedLeads = 0;
            let revokedAchievements = 0;
            for(const achievement of client.getAchievements()) {
                const role: discord.Role = newMember.guild.roles.cache.find(r => r.name === achievement.getRoleName());
                if(role) {
                    newMember.roles.remove(role);
                }
            }
            if(userdata) {
                [deletedLeads, revokedAchievements] = client.db.deleteAchievementInformation(userdata.gw2account);
            }
            U.log("info", `Player ${newMember.displayName} assigned themselves an achievement ignoring role(s) ${ignoringRoles.map(r => r.name)}. Revoked ${revokedAchievements} achievements and all information about ${deletedLeads} leads from the DB.`);
        }
    }
}

module.exports = IgnoringRolesListener;