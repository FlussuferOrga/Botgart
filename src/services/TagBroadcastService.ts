import discord, { EmbedBuilder, Guild, Message, resolveColor } from "discord.js";
import { BotgartClient } from "../BotgartClient.js";
import { getConfig } from "../config/Config.js";
import * as L from "../Locale.js";
import { Commander, LeadType } from "../Commanders.js";
import { logger } from "../util/Logging.js";
const LOG = logger();

export class TagBroadcastService {
    private readonly ZERO_WIDTH_SPACE = "\u200B";
    private readonly COLOR_ACTIVE = resolveColor("Green");
    private readonly COLOR_INACTIVE = resolveColor("Red");
    private readonly COLOR_UNKNOWN = resolveColor("Grey");
    private readonly broadcastChannel: string;
    private readonly pingRole: string;
    private readonly pingRolePPT: string;
    private readonly pingRolePPK: string;
    private readonly client: BotgartClient;

    constructor(client: BotgartClient) {
        this.client = client;
        const config = getConfig().get();

        this.broadcastChannel = config.ts_listener.broadcast_channel;
        this.pingRole = config.ts_listener.ping_role;
        this.pingRolePPT = config.ts_listener.ping_role_ppt;
        this.pingRolePPK = config.ts_listener.ping_role_ppk;
    }

    async sendTagUpBroadcast(g: discord.Guild, commander: Commander) {
        // broadcast the message
        const textChannel: discord.TextBasedChannel = g.channels.cache.find(
            (c) => c.name === this.broadcastChannel && c.isTextBased()
        ) as discord.TextBasedChannel;
        if (!textChannel) {
            LOG.warn(
                `I was supposed to broadcast the commander message on guild '${g.name}' in channel '${this.broadcastChannel}', but no such channel was found there. Skipping.`
            );
        } else {
            const message = await this.generateMessage(g, commander);
            const embed = this.createEmbed(commander);
            let send = await textChannel.send({ content: message, embeds: [embed] });
            if (send.crosspostable) {
                send = await send.crosspost();
            }
            return send;
        }
        return undefined;
    }

    private async generateMessage(g: Guild, commander: Commander) {
        const currentWorldId = commander.getRegistration()?.current_world_id;
        let role = "?";
        if (currentWorldId) {
            const assignment = await this.client.validationService.getAssignmentByWorldId(currentWorldId);
            if (assignment) {
                role = assignment.role;
            }
        }
        const pingRoleMention = this.generatePingRolesMention(g, commander);

        let name = commander.getDiscordMember()?.displayName || commander.getTS3DisplayName();
        if (commander.getDiscordMember()?.user !== undefined) {
            // user is known on discord -> is pingable
            name = commander.getDiscordMember()!.user!.toString();
        }
        return this.ZERO_WIDTH_SPACE + pingRoleMention + "\n" + L.get("COMMANDER_TAG_UP", [name, role], "\n");
    }

    private generatePingRolesMention(g: Guild, commander: Commander) {
        const pingRoles: discord.Role[] = this.detectRoles(g, commander.getCurrentLeadType());

        return pingRoles.map((value) => value.toString()).join(",");
    }

    private detectRoles(g: Guild, currentLeadType: LeadType): discord.Role[] {
        function addRoleIfExists(list: discord.Role[], roleName: string) {
            const generalRole: discord.Role | undefined = g.roles.cache.find((r) => r.name === roleName);
            if (generalRole) {
                list.push(generalRole);
            }
        }

        const roles: discord.Role[] = [];
        addRoleIfExists(roles, this.pingRole);

        switch (currentLeadType) {
            case "UNKNOWN":
                break;
            case "PPT":
                addRoleIfExists(roles, this.pingRolePPT);
                break;
            case "PPK":
                addRoleIfExists(roles, this.pingRolePPK);
                break;
        }
        return roles;
    }

    async tagUpdateBroadcast(g: discord.Guild, commander: Commander) {
        const message = await TagBroadcastService.fetchMessageOrNull(commander);
        if (message) {
            const messageEmbed = this.createEmbed(commander);
            const msgContent = await this.generateMessage(g, commander);
            await message.edit({ content: msgContent, embeds: [messageEmbed] });
        }
    }

    private createEmbed(commander: Commander, active = true, color = this.COLOR_ACTIVE) {
        const embed = new EmbedBuilder();
        switch (commander.getCurrentLeadType()) {
            case "UNKNOWN":
                break;
            case "PPT":
                embed.addFields([
                    {
                        name: "Lead Type",
                        value: "🏰️  **PPT**\n" + L.get("COMMANDER_TAG_UP_TYPE_PPT", [], " | ", false),
                    },
                ]);
                break;
            case "PPK":
                embed.addFields([
                    {
                        name: "Lead Type",
                        value: "⚔ ️**PPK**\n" + L.get("COMMANDER_TAG_UP_TYPE_PPK", [], " | ", false),
                    },
                ]);
                break;
        }

        let text =
            commander
                .getTs3channelPath()
                .map((value) => `\`${value}\``)
                .join(" ❯ ") +
            " ❯ " +
            commander.getTS3DisplayName();
        if (active && commander.getTs3joinUrl()) {
            const linkText = L.get("COMMANDER_TAG_UP_TEAMSPEAK_LINK_TEXT", [], " | ", false);
            const linkAltText = L.get("COMMANDER_TAG_UP_TEAMSPEAK_LINK_ALT", [], "\n\n", false);
            text += `\n [🔗 ${linkText}](${commander.getTs3joinUrl()} '${linkAltText}')`;
        }

        embed.addFields([{ name: `${active ? "🔊" : "🔈"} TeamSpeak 3`, value: text, inline: false }]);

        if (commander.getRaidStart() !== undefined || commander.getRaidEnd() !== undefined) {
            const lines: string[] = [];
            let timestampFormat = "R"; // https://hammertime.cyou/de
            if (!active) {
                timestampFormat = "f";
            }
            if (commander.getRaidStart() !== undefined) {
                lines.push(`**Start:** <t:${commander.getRaidStart()!.toSeconds()!}:${timestampFormat}>`);
            }
            if (commander.getRaidEnd() !== undefined) {
                lines.push(`**End:** <t:${commander.getRaidEnd()!.toSeconds()!}:${timestampFormat}>`);
            }
            embed.addFields([
                {
                    name: "🕐 " + L.get("COMMANDER_TAG_UP_TIMES", [], " | ", false),
                    value: lines.join("\n"),
                },
            ]);
        }
        embed.setColor(color);
        embed.setTimestamp(new Date());
        return embed;
    }

    async tagDownBroadcast(commander: Commander) {
        const message = await TagBroadcastService.fetchMessageOrNull(commander);
        if (message !== undefined) {
            const messageEmbed = this.createEmbed(commander, false, this.COLOR_INACTIVE);
            await message.edit({ embeds: [messageEmbed] });
        }
    }

    private static async fetchMessageOrNull(commander: Commander): Promise<undefined | Message> {
        try {
            return await commander.getBroadcastMessage()?.fetch();
        } catch (e) {
            LOG.warn(`Cannot tag down, message not found. ${e}`);
        }
        return undefined;
    }

    async tagDownAllBroadcastsForShutdown() {
        for (const commander of this.client.commanders.getAllCommanders()) {
            const message = await TagBroadcastService.fetchMessageOrNull(commander); // better refetch...
            if (message?.guild) {
                LOG.info(`Setting Broadcast message status to unknown state due to shutdown: ${message.id}`);

                const messageEmbed = this.createEmbed(commander, false, this.COLOR_UNKNOWN);
                const msgContent = await this.generateMessage(message.guild, commander);
                await message.edit({ content: msgContent, embeds: [messageEmbed] });
            }
        }
    }
}
