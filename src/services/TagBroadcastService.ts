import discord, { MessageEmbed, Util } from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import * as L from "../Locale";
import { Registration } from "../repositories/RegistrationRepository";
import { Commander } from "../TS3Connection";
import { log } from "../Util";

export class TagBroadcastService {
    private readonly ZERO_WIDTH_SPACE = "\u200B";
    private readonly COLOR_ACTIVE = Util.resolveColor("GREY");
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

            const embed = new MessageEmbed();
            embed.addField("TS 🔊", channelPath + " ❯ " + commander.getTS3DisplayName())
            embed.setColor(this.COLOR_ACTIVE)

            const name = discordUser?.displayName || commander.getTS3DisplayName();
            const role = registration?.registration_role || "?";
            const pingRoleMention = pingRole ? pingRole.toString() : "";

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

    private createMessage(name: string, role: string, pingRoleString: string) {
        return this.ZERO_WIDTH_SPACE + "\n" + L.get("COMMANDER_TAG_UP", [name, role, pingRoleString], "\n");
    }

    async tagDownBroadcast(commander: Commander) {
        const message = await commander.getBroadcastMessage()?.fetch(); // better refetch...
        if (message !== undefined) {
            const embed = message.embeds[0];
            if (embed && embed.color != this.COLOR_INACTIVE) {
                embed.setColor(this.COLOR_INACTIVE)
                await message.edit(embed)
            }
        }
    }

    async tagDownAllBroadcastsForShutdown() {
        for (const commander of this.client.commanders.getAllCommanders()) {
            await commander.getBroadcastMessage()?.fetch() // better refetch...
                .then(async value => {
                    log("info", `Setting Broadcast message status to unknown state due to shutdown: ${value.id}`);
                    const embed = value.embeds[0];
                    if (embed && embed.color != this.COLOR_UNKNOWN) {
                        embed.setColor(this.COLOR_UNKNOWN)
                        await value.edit(embed)
                    }
                })
        }
    }

}