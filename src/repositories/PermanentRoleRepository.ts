import { logger } from "../util/Logging";
import { AbstractDbRepository } from "./AbstractDbRepository";

const LOG = logger();

export class PermanentRoleRepository extends AbstractDbRepository {
    public storePermanentRole(user: string, guild: string, role: string): boolean {
        const sql = "INSERT INTO permanent_roles(guild, user, role) VALUES(?,?,?)";
        return this.execute((db) => {
            try {
                db.prepare(sql).run(guild, user, role);
                return true;
            } catch (err) {
                LOG.error("Error while trying to store permanent role: {0}.".formatUnicorn(err.message));
                return false;
            }
        }) as boolean;
    }

    public getPermanentRoles(user: string, guild: string): string[] {
        return this.execute((db) =>
            db
                .prepare("SELECT role FROM permanent_roles WHERE guild = ? AND user = ?")
                .all(guild, user)
                .map((r) => r.role)
        );
    }

    public deletePermanentRole(user: string, guild: string, role: string): boolean {
        const sql = "DELETE FROM permanent_roles WHERE guild = ? AND user = ? AND role = ?";
        return this.execute((db) => {
            try {
                db.prepare(sql).run(guild, user, role);
                return true;
            } catch (err) {
                LOG.error("Error while trying to store permanent role: {0}.".formatUnicorn(err.message));
                return false;
            }
        }) as boolean;
    }
}
