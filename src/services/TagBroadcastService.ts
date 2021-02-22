import discord, { MessageEmbed, Util } from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import * as L from "../Locale";
import { Registration } from "../repositories/RegistrationRepository";
import { Commander } from "../TS3Connection";
import { log } from "../Util";

export class TagBroadcastService {
    private readonly ZERO_WIDTH_SPACE = "\u200B";
    private readonly COLOR_ACTIVE = Util.resolveColor("GREEN");
    private readonly COLOR_INACTIVE = Util.resolveColor("RED");
    private readonly COLOR_UNKNOWN = Util.resolveColor("GREY");

    private client: BotgartClient;
    private broadcastChannel: string;
    private pingRole: string;

    constructor(client: BotgartClient) {
        this.client = client;
        const config = getConfig().get();

        this.broadcastChannel = config.ts_listener.broadcast_channel;
        this.pingRole = config.ts_listener.ping_role;

    }

    async sendTagUpBroadcast(g: discord.Guild,
                             commander: Commander,
                             discordUser: discord.GuildMember | undefined,
                             registration: undefined | Registration) {
        // broadcast the message
        const dchan: discord.TextChannel = <discord.TextChannel>g.channels.cache.find(c => c.name === this.broadcastChannel && c.type == "text");
        if (!dchan) {
            log("warning", `I was supposed to broadcast the commander message on guild '${g.name}' in channel '${this.broadcastChannel}', but no such channel was found there. Skipping.`);
        } else {
            const pingRole = g.roles.cache.find(r => r.name === this.pingRole);
            const channelPath = commander.getTs3channelPath().map(value => `\`${value}\``).join(" ❯ ");
            const name = discordUser?.displayName || commander.getTS3DisplayName();

            const role = registration?.registration_role || "?";
            const pingRoleMention = pingRole ? pingRole.toString() : "";

            const embed = this.createEmbed(channelPath, commander);
            const sendPromise = dchan.send(this.createMessage(name, role, pingRoleMention), embed);

            if (discordUser?.user !== undefined) {
                // user is known on discord -> is pingable
                const userMention = discordUser!.user!.toString();
                // replace message with version that links the user after it hast been sent initially.
                // Editing does not trigger a notification.
                return sendPromise.then(value => value.edit(this.createMessage(userMention, role, pingRoleMention), embed))
            }
            return sendPromise
        }
    }

    private createEmbed(channelPath: string, commander: Commander, includeLink = true, color = this.COLOR_ACTIVE) {
        const embed = new MessageEmbed();
        let text = channelPath + " ❯ " + commander.getTS3DisplayName();
        if (commander.getTs3joinUrl())
            text += `\n\n [🔗 Join on TeamSpeak](${commander.getTs3joinUrl()} 'If you have TeamSpeak 3 installed, you can join by clicking here')`
        embed.addField("🔊 TeamSpeak 3", text, false)
        embed.setColor(color)
        return embed;
    }

    private createMessage(name: string, role: string, pingRoleString: string) {
        return this.ZERO_WIDTH_SPACE + "\n" + L.get("COMMANDER_TAG_UP", [name, role, pingRoleString], "\n");
    }

    async tagDownBroadcast(commander: Commander) {
        const message = await commander.getBroadcastMessage()?.fetch(); // better refetch...
        if (message !== undefined) {
            await TagBroadcastService.updateEmbedTagdown(message, this.COLOR_INACTIVE);
        }
    }

    async tagDownAllBroadcastsForShutdown() {
        for (const commander of this.client.commanders.getAllCommanders()) {
            const message = await commander.getBroadcastMessage()?.fetch(); // better refetch...
            if (message !== undefined) {
                log("info", `Setting Broadcast message status to unknown state due to shutdown: ${message.id}`);
                await TagBroadcastService.updateEmbedTagdown(message, this.COLOR_UNKNOWN)
            }
        }
    }

    private static async updateEmbedTagdown(message: any, color: number) {
        const embed = message.embeds[0];
        if (embed) {
            let toUpdate = false
            if (embed.color != color) {
                toUpdate = true
                embed.setColor(color)
            }
            if (embed.fields.length == 1) {
                const field = embed.fields[0];
                const textLines = field.value.split('\n');
                if (textLines.length > 1) {
                    toUpdate = true
                    const newField = {name: field.name, value: textLines[0], inline: field.inline};
                    embed.spliceFields(0, 1, newField);
                }
            }
            if (toUpdate) {
                await message.edit(embed)
            }
        }
    }
}