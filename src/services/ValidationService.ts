import discord, { GuildMember, Role, Snowflake } from "discord.js";
import { isEqual, sortBy, uniq } from "lodash-es";
import { BotgartClient } from "../BotgartClient.js";
import { getConfig, WorldAssignment } from "../config/Config.js";
import { logger } from "../util/Logging.js";
import { findRole } from "../util/Util.js";
import { AccountData, getAccountInfo } from "../Gw2ApiUtils.js";
import * as Util from "../util/Util.js";
import * as L from "../Locale.js";
import { Registration } from "../mikroorm/entities/Registration.js";

const LOG = logger();

export class DeclinedApiKeyError extends Error {}

export class KeyNotUniqueError extends Error {}

export class KeyInvalidFormatError extends Error {}

export class ValidationService {
    private static readonly LOG_TYPE_AUTH: string = "auth";
    private static readonly API_KEY_REGEX = /^[A-Z0-9]{8}-([A-Z0-9]{4}-){3}[A-Z0-9]{20}-([A-Z0-9]{4}-){3}[A-Z0-9]{12}$/;

    private client: BotgartClient;
    private activeLinkRoleName: string;

    constructor(client: BotgartClient) {
        this.client = client;
        this.worldAssignments = getConfig().get().world_assignments;
        this.activeLinkRoleName = getConfig().get().current_link_role;
    }

    private readonly worldAssignments: WorldAssignment[];

    public async setMemberRolesByWorldId(member: GuildMember, worldId: number | null, reason?: string) {
        return this.setMemberRolesByWorldAssignment(member, this.getAssignmentByWorldId(worldId), reason);
    }

    public async setMemberRolesByWorldAssignment(member: GuildMember, worldAssignment: WorldAssignment | undefined | null, reason?: string) {
        const wantedRoleNames: string[] = [];
        if (worldAssignment) {
            wantedRoleNames.push(worldAssignment.role);
            if (worldAssignment.link) {
                wantedRoleNames.push(this.activeLinkRoleName);
            }
        }

        const wantedRoles = wantedRoleNames.map((roleName) => findRole(member.guild, roleName)).filter((value) => value !== undefined) as Role[];

        return this.setMemberRoles(member, wantedRoles, reason);
    }

    private async setMemberRoles(member: GuildMember, wantedRoles: Role[], reason?: string) {
        const guildMember = await member.fetch();
        const guild = guildMember.guild;

        const discordWorldRoles = this.worldAssignments
            .map((value) => value.role)
            .map((roleName) => findRole(guild, roleName))
            .filter((value) => value !== undefined) as Role[];

        const allManagedRoles = [...discordWorldRoles];

        const activeLinkRole = findRole(guild, this.activeLinkRoleName);
        if (activeLinkRole !== undefined) {
            allManagedRoles.push(activeLinkRole);
        }

        const rolesToRemove = allManagedRoles.filter((value) => !wantedRoles.includes(value));

        const currentRoles = guildMember.roles.cache.map((value) => value);
        const desiredUserRoles = uniq(currentRoles.filter((value) => !rolesToRemove.includes(value)).concat(wantedRoles));

        if (!isEqual(sortBy(desiredUserRoles), sortBy(currentRoles))) {
            const toAdd = wantedRoles.filter((wantedRoleId) => !currentRoles.includes(wantedRoleId));
            const toRemove = rolesToRemove.filter((toRemove) => currentRoles.includes(toRemove));

            const toAddList = toAdd.map((value) => value.name).join(",");
            const toRemoveList = toRemove.map((value) => value.name).join(",");
            LOG.info(`User roles of ${guildMember.user.tag} need to be updated.\n\tAdd: ${toAddList}\n\tRemove: ${toRemoveList}`);

            await guildMember.roles.set(desiredUserRoles, reason);
        }
    }

    public async validate(apiKey: string, author: discord.User) {
        apiKey = apiKey.trim().toUpperCase();
        this.validateKeyFormat(apiKey);
        const accountData = await getAccountInfo(apiKey);

        const worldAssignment = await this.getAssignmentByWorldId(accountData.world);

        if (worldAssignment === undefined) {
            LOG.info("Declined API key {0}.".formatUnicorn(apiKey));
            throw new DeclinedApiKeyError();
        } else {
            const members = await this.getGuildMemberships(author.id);
            await Util.asyncForEach(members, async (member: discord.GuildMember) => {
                await this.addVerificationInGuild(member, worldAssignment, apiKey, accountData);
            });
        }
    }

    private async addVerificationInGuild(member: GuildMember, worldAssignment: WorldAssignment, apiKey: string, accountData: AccountData) {
        const registration = await this.client.registrationRepository.storeAPIKey(
            member.user.id,
            member.guild.id,
            apiKey,
            accountData.id,
            accountData.name,
            accountData.world
        ); // this cast should pass, since we either resolved by now or fell back to NULL
        if (registration !== null) {
            LOG.info("Accepted {0} for {1} on {2} ({3}).".formatUnicorn(apiKey, member.user.username, member.guild.name, member.guild.id));
            await this.client.validationService.setMemberRolesByWorldAssignment(member, worldAssignment, "Authentication");
            await this.client.discordLog(
                member.guild,
                ValidationService.LOG_TYPE_AUTH,
                L.get("DLOG_AUTH", [Util.formatUserPing(member.id), accountData.name as string, worldAssignment.role]),
                false
            );
            return;
        }
    }

    private async getGuildMemberships(userId: Snowflake) {
        const members: discord.GuildMember[] = []; // plural, as this command takes place on all servers this bot shares with the user
        // this snippet allows users to authenticate themselves
        // through a DM and is dedicated to Jey, who is a fucking
        // numbnut when it comes to data privacy and posting your
        // API key in public channels.
        for (const guild of this.client.guilds.cache.values()) {
            const m: discord.GuildMember = await guild.members.fetch(userId); // cache.find(m => m.id == message.author.id);
            if (m) {
                members.push(m);
            }
        }
        return members;
    }

    private validateKeyFormat(apiKey: string) {
        const validFormat: boolean = ValidationService.API_KEY_REGEX.test(apiKey);
        if (!validFormat) {
            LOG.info("Invalid Format received");
            throw new KeyInvalidFormatError();
        }
    }

    public getAssignmentByWorldId(worldId: number | null): WorldAssignment | undefined {
        return this.worldAssignments.find((value) => value.world_id == worldId);
    }

    public async deleteMember(registration: Pick<Registration, "guild" | "user">, member?: GuildMember, reason?: string) {
        if (member) {
            await this.client.validationService.setMemberRolesByWorldAssignment(member, null, reason);
        }
        await this.client.registrationRepository.deleteById(registration);
    }
}
