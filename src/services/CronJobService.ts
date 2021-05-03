import discord from "discord.js";
import * as schedule from "node-schedule";
import { Job } from "node-schedule";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import { CronJobRepository } from "../repositories/CronJobRepository";
import { logger } from "../util/Logging";

const LOG = logger();

export class CronJobService {
    private repository: CronJobRepository;
    private client: BotgartClient;
    public scheduledJobs: Map<number, Job> = new Map<number, Job>();


    constructor(repository: CronJobRepository, client: BotgartClient) {
        this.repository = repository;
        this.client = client;
    }

    /**
     * Reschedules all cronjobs that are still in the database.
     * @returns {int} - number of successfully scheduled crons.
     */
    public rescheduleCronJobs() {
        let cronCount = 0;
        this.client.cronJobRepository.getCronJobs().forEach(async cron => {
            const mod: BotgartCommand = <BotgartCommand>this.client.commandHandler.modules.get(cron.command);
            const args = mod.deserialiseArgs(cron.arguments || "{}"); // make sure JSON.parse works for empty command args
            const guild = this.client.guilds.cache.find(g => g.id == cron.guild);
            if (!guild) {
                LOG.error("I am no longer member of the guild {0} the cronjob with ID {1} was scheduled for. Skipping.".formatUnicorn(cron.guild, cron.id));
            } else {
                const responsible: discord.GuildMember = await guild.members.fetch(cron.created_by); // cache.find(m => m.user.id == cron.created_by);

                if (!responsible) {
                    LOG.warn("Responsible user with ID {0} for cronjob {1} is no longer present in Guild {2}.".formatUnicorn(cron.created_by, cron.id, guild.name));
                } else {
                    const job = this.scheduleCronJob(cron.schedule, responsible.user, guild, mod, args);
                    if (!job) {
                        LOG.error("Could not reschedule cronjob {0} although it was read from the database.".formatUnicorn(cron.id));
                    } else {
                        if (cron.id in this.scheduledJobs && this.scheduledJobs[cron.id]) {
                            // just to be safe, cancel any remaining jobs before rescheduling them
                            this.scheduledJobs[cron.id].cancel();
                        }
                        this.scheduledJobs[cron.id] = job;
                        cronCount++;
                        LOG.info("Rescheduled cronjob {0} of type '{1}'".formatUnicorn(cron.id, cron.command));
                    }
                }
            }
        });
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
    scheduleCronJob(time: string, responsible: discord.User, guild: discord.Guild, cmd: BotgartCommand, args: unknown) {
        return schedule.scheduleJob(time, function (m, r, g, as) {
            m.command(null, r, g, as);
        }.bind(this, cmd, responsible, guild, args));
    }
}