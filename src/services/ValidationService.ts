import discord, { Guild, GuildMember, Role, Snowflake, UserResolvable } from "discord.js";
import { isEqual, sortBy, uniq } from "lodash-es";
import { BotgartClient } from "../BotgartClient.js";
import { getConfig, GuildAssignment, WorldAssignment } from "../config/Config.js";
import { logger } from "../util/Logging.js";
import * as Util from "../util/Util.js";
import { findRole } from "../util/Util.js";
import { AccountData, getAccountInfo } from "../Gw2ApiUtils.js";
import * as L from "../Locale.js";
import { MemberForRoleRepair } from "../repositories/RegistrationRepository.js";
import { Registration } from "../mikroorm/entities/Registration.js";

const LOG = logger();

export class DeclinedApiKeyError extends Error {}

export class KeyInvalidFormatError extends Error {}

export class ValidationService {
    private static readonly LOG_TYPE_AUTH: string = "auth";
    private static readonly API_KEY_REGEX = /^[A-Z0-9]{8}-([A-Z0-9]{4}-){3}[A-Z0-9]{20}-([A-Z0-9]{4}-){3}[A-Z0-9]{12}$/;

    private client: BotgartClient;
    private readonly activeLinkRoleName: string;

    constructor(client: BotgartClient) {
        this.client = client;
        this.worldAssignments = getConfig().get().world_assignments;
        this.guildAssignments = getConfig().get().guild_assignments;
        this.activeLinkRoleName = getConfig().get().current_link_role;
    }

    private readonly worldAssignments: WorldAssignment[];
    private readonly guildAssignments: GuildAssignment[];

    public async synchronizeDiscordRoles(
        member: GuildMember,
        registration: Pick<Registration, "current_world_id" | "gw2GuildIds"> | null,
        reason?: string
    ) {
        const desiredRoleNames: string[] = [];
        if (registration) {
            if (registration.current_world_id) {
                const worldAssignment = this.getAssignmentByWorldId(registration.current_world_id);
                if (worldAssignment) {
                    desiredRoleNames.push(worldAssignment.role);
                    if (worldAssignment.link) {
                        desiredRoleNames.push(this.activeLinkRoleName);
                    }
                }
            }
            if (registration.gw2GuildIds) {
                desiredRoleNames.push(
                    ...registration.gw2GuildIds
                        .map((value) => this.getGuildRoleByGuildId(value))
                        .filter((value) => value != undefined)
                        .map((value) => value!.role)
                        .filter((value) => value != undefined)
                );
            }
        }

        const desiredRoles = desiredRoleNames.map((roleName) => findRole(member.guild, roleName)).filter((value) => value !== undefined) as Role[];
        await this.setMemberRoles(member, desiredRoles, reason);
        return;
    }

    private async setMemberRoles(member: GuildMember, desiredRoles: Role[], reason?: string) {
        const guildMember = await member.fetch();
        const allManagedRoles = this.collectAllManagedRoles(guildMember.guild);

        const rolesToRemove = allManagedRoles.filter((value) => !desiredRoles.includes(value));
        const currentRoles = guildMember.roles.cache.map((value) => value);
        const desiredUserRoles = uniq(currentRoles.filter((value) => !rolesToRemove.includes(value)).concat(desiredRoles));

        if (!isEqual(sortBy(desiredUserRoles), sortBy(currentRoles))) {
            const toAdd = desiredRoles.filter((wantedRoleId) => !currentRoles.includes(wantedRoleId));
            const toRemove = rolesToRemove.filter((toRemove) => currentRoles.includes(toRemove));

            this.logRoleUpdate(guildMember, toAdd, toRemove);

            await guildMember.roles.set(desiredUserRoles, reason);
            return;
        }
    }

    private logRoleUpdate(guildMember: GuildMember, toAdd: Role[], toRemove: Role[]) {
        const roleNamesToAdd = toAdd.map((value) => value.name);
        const roleNamesToRemove = toRemove.map((value) => value.name);
        LOG.info(
            `User roles of ${guildMember.user.tag} need to be updated.\n\tAdd: ${roleNamesToAdd.join(",")}\n\tRemove: ${roleNamesToRemove.join(",")}`
        );
    }

    private collectAllManagedRoles(guild: Guild) {
        const managedRoles = [...this.worldAssignments, ...this.guildAssignments]
            .map((value) => value.role)
            .map((roleName) => findRole(guild, roleName))
            .filter((value) => value !== undefined) as Role[];

        const allManagedRoles = [...managedRoles];

        const activeLinkRole = findRole(guild, this.activeLinkRoleName);
        if (activeLinkRole !== undefined) {
            allManagedRoles.push(activeLinkRole);
        }
        return allManagedRoles;
    }

    public async validate(apiKey: string, author: discord.User) {
        apiKey = apiKey.trim().toUpperCase();
        this.validateKeyFormat(apiKey);
        const accountData = await getAccountInfo(apiKey);

        const members = await this.getGuildMemberships(author.id);
        await Util.asyncForEach(members, async (member: discord.GuildMember) => {
            await this.addVerificationInGuild(member, apiKey, accountData);
        });
    }

    private async addVerificationInGuild(member: GuildMember, apiKey: string, accountData: AccountData) {
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
            await this.client.validationService.synchronizeDiscordRoles(member, registration, "Authentication");
            await this.client.discordLog(
                member.guild,
                ValidationService.LOG_TYPE_AUTH,
                L.get("DLOG_AUTH", [Util.formatUserPing(member.id), accountData.name as string]),
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
            const m: GuildMember | null = await this.getMember(guild, userId);
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

    private getGuildRoleByGuildId(guildId: string): GuildAssignment | undefined {
        return this.guildAssignments.find((value) => value.guild_id == guildId);
    }

    public getAssignmentByWorldId(worldId: number | null): WorldAssignment | undefined {
        return this.worldAssignments.find((value) => value.world_id == worldId);
    }

    public async repairRoles(guild: Guild) {
        LOG.info(`Starting role repair.`);

        const designations: MemberForRoleRepair[] = await this.client.registrationRepository.getDesignatedRoles(guild.id);
        LOG.info(`Found ${designations.length} users to check.`);

        await Promise.all(
            designations.map(async (d) => {
                const member: GuildMember | null = await this.getMember(guild, d.user);
                if (member) {
                    LOG.debug(`Repairing ${d.user} -> ${member.nickname || member.user.username}`);
                    await this.client.validationService.synchronizeDiscordRoles(member, d, "Role Repair");
                } else {
                    LOG.debug(`Repairing Non-Member ${d.user}`);
                    await this.client.validationService.client.registrationRepository.deleteById(d);
                }
            })
        );
    }

    private async getMember(guild: Guild, user: UserResolvable): Promise<GuildMember | null> {
        try {
            return await guild.members.fetch({ user: user });
        } catch (e) {
            if (e.code == 10007) {
                // Unknown member
                return null; // User is not a member
            }
            throw e;
        }
    }
}
