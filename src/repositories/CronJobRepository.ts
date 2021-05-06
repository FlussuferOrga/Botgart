import { AbstractDbRepository } from "./AbstractDbRepository";

export class CronJobRepository extends AbstractDbRepository {
    public storeCronJob(job: CronJobEntity): number | undefined {
        const sql = "INSERT INTO cronjobs(schedule, command, arguments, created_by, guild) VALUES (?, ?, ?, ?, ?)";
        return this.execute(db => {
            let lastId = undefined;
            db.transaction((_) => {
                db.prepare(sql).run(job.schedule, job.command, job.arguments, job.created_by, job.guild);
                lastId = db.prepare("SELECT last_insert_rowid() AS id").get().id;
            })(null);
            return lastId;
        });
    }

    public getCronJobs(): StoredCronJobEntity[] {
        return this.execute(db => db.prepare(`SELECT *
                                              FROM cronjobs`).all());
    }

    public deleteCronJob(id: number): boolean | undefined {
        return this.execute(db => {
            let changes = 0;
            db.transaction((_) => {
                db.prepare(`DELETE
                            FROM cronjobs
                            WHERE id = ?`).run(id);
                changes = db.prepare("SELECT changes() AS changes").get().changes;
            })(null);
            return changes > 0;
        });
    }
}

export class CronJobEntity {
    schedule: string;
    command: string;
    arguments: string;
    created_by: string;
    guild: string;
}

export class StoredCronJobEntity extends CronJobEntity {
    id: number;
    created: string;
}