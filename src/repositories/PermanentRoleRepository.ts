import { AbstractDbRepository } from "./AbstractDbRepository";
import { PermanentRole } from "../mikroorm/entities/PermanentRole";

export class PermanentRoleRepository extends AbstractDbRepository {
    public async storePermanentRole(user: string, guild: string, role: string): Promise<PermanentRole> {
        return await this.orm.em.getRepository(PermanentRole).upsert({
            guild,
            user,
            role,
        });
    }

    public async getPermanentRoles(user: string, guild: string): Promise<string[]> {
        const roles = await this.orm.em.getRepository(PermanentRole).find(
            {
                guild: guild,
                user: user,
            },
            { fields: ["role"] }
        );
        return roles.map((value) => value.role);
    }

    public async deletePermanentRole(user: string, guild: string, role: string): Promise<boolean> {
        const permRole = await this.orm.em.findOne(PermanentRole, { guild, user, role });
        if (permRole !== null) {
            await this.orm.em.removeAndFlush(permRole);
            return true;
        }
        return false;
    }
}
