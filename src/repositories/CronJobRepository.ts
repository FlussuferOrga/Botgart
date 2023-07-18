import { AbstractDbRepository } from "./AbstractDbRepository.js";
import { CronJob } from "../mikroorm/entities/CronJob.js";

export class CronJobRepository extends AbstractDbRepository {
    public async storeCronJob(job: Omit<CronJob, "id" | "created">): Promise<CronJob> {
        const cronJob = this.orm.em.create(CronJob, { ...job });
        await this.orm.em.persistAndFlush(cronJob);
        return cronJob;
    }

    public async getCronJobs(): Promise<CronJob[]> {
        return await this.orm.em.getRepository(CronJob).findAll();
    }

    public async deleteCronJob(id: number): Promise<boolean> {
        const reference = this.orm.em.getReference(CronJob, id);
        if (reference) {
            await this.orm.em.remove(reference).flush();
            return true;
        }
        return false;
    }
}
