import discord from "discord.js";
import { AbstractDbRepository } from "./AbstractDbRepository";

export class LogChannelRepository extends AbstractDbRepository{
    public getLogChannels(guild: discord.Guild, type: string): string[] {
        return this.execute(db => {
            const channels = db.prepare("SELECT channel FROM discord_log_channels WHERE guild = ? AND type = ?")
                .all(guild.id, type);
            return channels === undefined ? [] : channels.map(c => c.channel);
        });
    }

    public addLogChannel(guild: discord.Guild, type: string, channel: discord.TextChannel): void {
        this.execute(db => db.prepare("INSERT INTO discord_log_channels(guild, type, channel) VALUES(?,?,?)").run(guild.id, type, channel.id));
    }

    public removeLogChannel(guild: discord.Guild, type: string, channel: discord.TextChannel): void {
        this.execute(db => db.prepare("DELETE FROM discord_log_channels WHERE guild = ? AND type = ? AND channel = ?").run(guild.id, type, channel.id));
    }

    public getLogTypes(guild: discord.Guild, channel: discord.TextChannel): string[] {
        return this.execute(db => {
            const types = db.prepare("SELECT type FROM discord_log_channels WHERE guild = ? AND channel = ?")
                .all(guild.id, channel.id);
            return types === undefined ? [] : types.map(t => t.type);
        });
    }
}