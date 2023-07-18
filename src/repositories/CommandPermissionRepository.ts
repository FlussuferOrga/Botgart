import { AbstractDbRepository } from "./AbstractDbRepository.js";
import { CommandPermission, PermissionType } from "../mikroorm/entities/CommandPermission.js";
import { Snowflake } from "discord.js";

export class Permission {
    command_permissions_id: number;
    command: string;
    receiver: string;
    type: PermissionType;
    value: number;
    guild: string;
}

export class CommandPermissionRepository extends AbstractDbRepository {
    public async getPermissions(guildId: string): Promise<CommandPermission[]> {
        return await this.orm.em.find(CommandPermission, { guild: guildId });
    }

    public async checkPermission(command: string, userId: string, roles: string[], guildId: Snowflake | null): Promise<number> {
        const knex = this.orm.em.getKnex();

        const where: Record<string, string> = {
            command: command,
        };

        if (guildId !== null) {
            where.guild = guildId;
        }

        const result = (await knex
            .select(knex.raw("TOTAL(value) AS permission"))
            .from("command_permissions")
            .where(where)
            .whereIn("type", [PermissionType.user, PermissionType.role])
            .whereIn("receiver", [userId, ...roles])
            .first()) as { permission: number };
        return result.permission;
    }

    public async removePermission(permissionId: number, guildId: string): Promise<void> {
        const reference = await this.orm.em.findOne(CommandPermission, {
            commandPermissionsId: permissionId,
            guild: guildId,
        });
        if (reference !== null) {
            return await this.orm.em.removeAndFlush(reference);
        }
    }

    public async setPermission(command: string, receiver: string, type: PermissionType, value: number, gid: string): Promise<CommandPermission> {
        return await this.orm.em.upsert(CommandPermission, { command, receiver, type, guild: gid, value });
    }
}
