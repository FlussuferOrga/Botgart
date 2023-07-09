import { AbstractDbRepository } from "./AbstractDbRepository";
import { CommandPermission, PermissionType } from "../mikroorm/entities/CommandPermission";

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

    public async checkPermission(command: string, userId: string, roles: string[], guildId?: string): Promise<[boolean, number]> {
        const knex = this.orm.em.getKnex();
        const permission = (await knex
            .select(knex.raw("TOTAL(value) AS permission"))
            .from("command_permissions")
            .where({
                command: command,
                guild: guildId,
            })
            .whereIn("type", [PermissionType.user, PermissionType.role])
            .whereIn("receiver", [userId, ...roles])
            .first()) as number;
        return [permission > 0, permission];
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
