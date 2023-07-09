import discord from "discord.js";
import { AbstractDbRepository } from "./AbstractDbRepository";
import { DiscordLogChannel } from "../mikroorm/entities/DiscordLogChannel";

export class LogChannelRepository extends AbstractDbRepository {
    public async getLogChannels(guild: discord.Guild, type: string): Promise<string[]> {
        const channels = await this.orm.em.find(DiscordLogChannel, { guild: guild.id, type }, { fields: ["channel"] });
        return channels.map((value) => value.channel);
    }

    public async getLogTypes(guild: discord.Guild, channel: discord.TextChannel): Promise<string[]> {
        const channels = await this.orm.em.find(
            DiscordLogChannel,
            {
                guild: guild.id,
                channel: channel.id,
            },
            { fields: ["type"] }
        );
        return channels.map((value) => value.type);
    }

    public async addLogChannel(guild: discord.Guild, type: string, channel: discord.TextChannel): Promise<DiscordLogChannel> {
        const logChannel = this.orm.em.create(DiscordLogChannel, { channel: channel.id, type, guild: guild.id });
        await this.orm.em.persistAndFlush(logChannel);
        return logChannel;
    }

    public async removeLogChannel(guild: discord.Guild, type: string, channel: discord.TextChannel): Promise<void> {
        const logChannel = await this.orm.em.findOne(DiscordLogChannel, { channel: channel.id, type, guild: guild.id });
        if (logChannel !== null) {
            await this.orm.em.removeAndFlush(logChannel);
        }
    }
}
