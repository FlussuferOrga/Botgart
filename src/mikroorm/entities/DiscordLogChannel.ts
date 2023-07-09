import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({
    tableName: "discord_log_channels",
})
export class DiscordLogChannel {
    @PrimaryKey({ nullable: false, autoincrement: true })
    discordLogChannelId?: number;

    @Property()
    guild!: string;

    @Property()
    type!: string;

    @Property()
    channel!: string;
}
