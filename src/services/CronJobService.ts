import discord, { Guild, User } from "discord.js";
import * as schedule from "node-schedule";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import { CronJobRepository } from "../repositories/CronJobRepository";
import { logger } from "../util/Logging";
import { RequestContext } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/better-sqlite";

const LOG = logger();

export class CronJobService {
    private repository: CronJobRepository;
    private client: BotgartClient;
    private readonly orm: MikroORM;
    public scheduledJobs: Map<number, schedule.Job> = new Map<number, schedule.Job>();

    constructor(repository: CronJobRepository, orm: MikroORM, client: BotgartClient) {
        this.repository = repository;
        this.client = client;
        this.orm = orm;
    }

    /**
     * Reschedules all cronjobs that are still in the database.
     * @returns {int} - number of successfully scheduled crons.
     */
    public async rescheduleCronJobs() {
        let cronCount = 0;
        const cronJobs = await this.client.cronJobRepository.getCronJobs();
        for (const cron of cronJobs) {
            const mod: BotgartCommand = this.client.commandHandler.modules.get(cron.command) as BotgartCommand;
            const args = mod.deserialiseArgs(cron.arguments || "{}"); // make sure JSON.parse works for empty command args
            const guild = this.client.guilds.cache.find((g) => g.id == cron.guild);
            if (!guild) {
                LOG.error(
                    "I am no longer member of the guild {0} the cronjob with ID {1} was scheduled for. Skipping.".formatUnicorn(cron.guild, cron.id)
                );
            } else {
                const responsible: discord.GuildMember = await guild.members.fetch(cron.createdBy); // cache.find(m => m.user.id == cron.created_by);

                if (!responsible) {
                    LOG.warn(
                        "Responsible user with ID {0} for cronjob {1} is no longer present in Guild {2}.".formatUnicorn(
                            cron.createdBy,
                            cron.id,
                            guild.name
                        )
                    );
                } else {
                    const job = this.scheduleCronJob(cron.schedule, responsible.user, guild, mod, args);
                    if (!job) {
                        LOG.error("Could not reschedule cronjob {0} although it was read from the database.".formatUnicorn(cron.id));
                    } else {
                        if (cron.id! in this.scheduledJobs && this.scheduledJobs[cron.id!]) {
                            // just to be safe, cancel any remaining jobs before rescheduling them
                            this.scheduledJobs[cron.id!].cancel();
                        }
                        this.scheduledJobs[cron.id!] = job;
                        cronCount++;
                        LOG.info("Rescheduled cronjob {0} of type '{1}'".formatUnicorn(cron.id, cron.command));
                    }
                }
            }
        }
        LOG.info("Done rescheduling {0} cronjobs.".formatUnicorn(cronCount));
        return cronCount;
    }

    /**
     * Schedules a new cronjob.
     * That is: it creates a cronjob, no database is involved at this point.
     * @param {string} time - cron string.
     * @param {User} responsible - who issued the cron.
     * @param {Guild} guild - Guild.
     * @param {Command} cmd - Command-module to execute.
     * @param {Map} args - Args for the command.
     * @returns {Job}
     */
    scheduleCronJob(time: string, responsible: discord.User, guild: discord.Guild, cmd: BotgartCommand, args: Record<string, unknown>) {
        const jobRunner = new JobRunner(cmd, responsible, guild, args);
        return schedule.scheduleJob(time, () => RequestContext.createAsync(this.orm.em, () => jobRunner.execute()));
    }
}

class JobRunner {
    private readonly cmd: BotgartCommand;
    private readonly responsible: User;
    private readonly guild: Guild;
    private readonly args: Record<string, unknown>;

    constructor(cmd: BotgartCommand, responsible: User, guild: Guild, args: Record<string, unknown>) {
        this.cmd = cmd;
        this.responsible = responsible;
        this.guild = guild;
        this.args = args;
    }

    //@UseRequestContext()
    async execute() {
        await this.cmd.command(null, this.responsible, this.guild, this.args);
    }
}
