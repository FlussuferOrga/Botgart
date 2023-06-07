import { GuildMember, Role } from "discord.js";
import _ from "lodash";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import { logger } from "../util/Logging";
import { findRole } from "../util/Util";

const LOG = logger();

export class ValidationService {
    private client: BotgartClient;

    constructor(client: BotgartClient) {
        this.client = client;
        this.worldAssignments = getConfig().get().world_assignments;
    }

    private readonly worldAssignments: { world_id: number; role: string }[];

    public async setMemberRolesByString(member: GuildMember, wantedServerRoleNames: string[], reason?: string) {
        const wantedRoles = wantedServerRoleNames
            .map((roleName) => findRole(member.guild, roleName))
            .filter((value) => value !== undefined) as Role[];

        return this.setMemberRoles(member, wantedRoles, reason);
    }

    public async setMemberRoles(member: GuildMember, wantedRoles: Role[], reason?: string) {
        const guildMember = await member.fetch();
        const guild = guildMember.guild;

        const discordWorldRoles = this.worldAssignments
            .map((value) => value.role)
            .map((roleName) => findRole(guild, roleName))
            .filter((value) => value !== undefined) as Role[];

        const rolesToRemove = discordWorldRoles.filter((value) => !wantedRoles.includes(value));

        const currentRoles = guildMember.roles.cache.map((value) => value);
        const desiredUserRoles = _.uniq(currentRoles.filter((value) => !rolesToRemove.includes(value)).concat(wantedRoles));

        if (!_.isEqual(_.sortBy(desiredUserRoles), _.sortBy(currentRoles))) {
            const toAdd = wantedRoles.filter((wantedRoleId) => !currentRoles.includes(wantedRoleId));
            const toRemove = rolesToRemove.filter((toRemove) => currentRoles.includes(toRemove));

            const toAddList = toAdd.map((value) => value.name).join(",");
            const toRemoveList = toRemove.map((value) => value.name).join(",");
            LOG.info(`User roles of ${guildMember.user.tag} need to be updated.\n\tAdd: ${toAddList}\n\tRemove: ${toRemoveList}`);

            await guildMember.roles.set(desiredUserRoles, reason);
        }
    }
}
