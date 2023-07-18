import * as discord from "discord.js";
import { ResetLeader } from "../commands/resetlead/ResetLeader.js";
import * as ResetUtil from "../commands/resetlead/ResetUtil.js";
import { Roster } from "../commands/resetlead/Roster.js";
import { WvwMap } from "../commands/resetlead/WvwMap.js";
import { logger } from "../util/Logging.js";
import { AbstractDbRepository } from "./AbstractDbRepository.js";
import { ResetRoster } from "../mikroorm/entities/ResetRoster.js";
import { ResetLeader as ResetLeaderEntity } from "../mikroorm/entities/ResetLeader.js";

import { compact } from "lodash-es";
import { Guild, GuildBasedChannel, TextChannel } from "discord.js";

const LOG = logger();

type RosterPost = [Roster, discord.TextChannel, discord.Message];

export class RosterRepository extends AbstractDbRepository {
    public async getActiveRosters(guild: discord.Guild): Promise<RosterPost[]> {
        const activeRosters = await this.orm.em.getRepository(ResetRoster).find(
            {
                weekNumber: { $gte: ResetUtil.currentWeek() },
                year: { $gte: ResetUtil.currentYear() },
                guild: guild.id,
            },
            { populate: ["leaders"] }
        );

        const values = activeRosters.map((roster) => this.createRosterObject(roster, guild));
        return compact(await Promise.all(values));
    }

    /**
     * Upserts the roster post for a guild. That is:
     * If no roster for that week exists in that guild, the post is stored.
     * Else, the commanders in that post are updated.
     * guild: the guild to upsert the roster post in.
     * roster: the roster to upsert. Uniqueness will be determined by week number and year of the roster.
     * message: the message that represents the roster post.
     */
    public async upsertRosterPost(guild: discord.Guild, roster: Roster, message: discord.Message): Promise<void> {
        let entity: ResetRoster;

        const existingEntity = await this.orm.em.findOne(
            ResetRoster,
            {
                guild: guild.id,
                weekNumber: roster.weekNumber,
                year: roster.year,
            },
            { populate: ["leaders"] }
        );
        if (existingEntity === null) {
            // completely new roster -> create new roster
            entity = await this.orm.em.create(ResetRoster, {
                guild: guild.id,
                weekNumber: roster.weekNumber,
                year: roster.year,
                channel: message.channel.id,
                message: message.id,
            });
        } else {
            // there is already a roster entry -> drop all leaders and insert the current state
            existingEntity.leaders.removeAll();
            entity = existingEntity;
        }
        this.orm.em.persist(entity);

        roster.getLeaders().forEach(([map, leader]) =>
            entity.leaders.add(
                this.orm.em.create(ResetLeaderEntity, {
                    player: leader.name,
                    map: map.name,
                    visible: false,
                })
            )
        );

        await this.orm.em.persistAndFlush(entity);
    }

    async getRosterPost(guild: discord.Guild, weekNumber: number, year: number): Promise<undefined | RosterPost> {
        const rosterEntity = await this.orm.em.findOne(
            ResetRoster,
            {
                guild: guild.id,
                weekNumber: weekNumber,
                year: year,
            },
            { populate: ["leaders"] }
        );
        return await this.createRosterObject(rosterEntity, guild);
    }

    private async createRosterObject(rosterEntity, guild: Guild): Promise<RosterPost | undefined> {
        if (rosterEntity === null) {
            return undefined;
        }
        const roster = new Roster(rosterEntity.weekNumber, rosterEntity.year);
        for (const leader of rosterEntity.leaders.getItems()) {
            roster.addLead(WvwMap.getMapByName(leader.map), new ResetLeader(leader.player, leader.visible));
        }

        const channel: GuildBasedChannel | null = guild.channels.resolve(rosterEntity.channel);
        if (channel === null || !(channel instanceof TextChannel)) {
            LOG.error(`Could not resolve channel with ID ${rosterEntity.channel} in guild ${guild.name}.`);
            return undefined;
        }
        const message: discord.Message | undefined = await channel.messages.fetch(rosterEntity.message);
        if (message === undefined) {
            return undefined;
        }
        return [roster as Roster, channel as discord.TextChannel, message as discord.Message];
    }
}
