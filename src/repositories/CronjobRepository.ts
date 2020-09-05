import { AbstractDbRepository } from "./AbstractDbRepository";

export class CronjobRepository extends AbstractDbRepository {
    public storeCronjob(schedule: string, command: string, args: string, creator: string, guild: string) : number | undefined {
        let sql = `INSERT INTO cronjobs(schedule, command, arguments, created_by, guild) VALUES (?,?,?,?,?)`;
        return this.execute(db => {
            let lastId = undefined;
            db.transaction((_) => {
                db.prepare(sql).run(schedule, command, args, creator, guild);
                lastId = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
            })(null);
            return lastId;
        });
    }

    public getCronjobs(): any {
        return this.execute(db => db.prepare(`SELECT * FROM cronjobs`).all());
    }

    public deleteCronjob(id: number): boolean|undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE FROM cronjobs WHERE id = ?`).run(id)
                changes = db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null);
            return changes > 0;
        });
    }
}