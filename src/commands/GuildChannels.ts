import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";


/**
 Testcases:

 */
export class GuildChannels extends BotgartCommand {
    constructor() {
        super("guildchannels", {
                aliases: ["guildchannels"],
                quoted: true,
                args: []
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, never>): Promise<void> {
        this.getBotgartClient().getTS3Connection().get("guild/channels", {})
            .then(res => {
                const data = JSON.parse(res);
                let result = "";
                if (Array.isArray(data)) {
                    for (const row of data) {
                        result += `${row["name"]} is empty since ${row["empty_since"]}\n`;
                    }
                }
                return message.reply(result);
            });
    }
}

module.exports = GuildChannels;