import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { createTable } from "../util/Table";
import * as L from "../Locale";

const CHARSET = "utf-8";
const ATTACHMENT_NAME = "result.txt";


export class GuildChannelList extends BotgartCommand {
    constructor() {
        super("guildchannnellist", {
                aliases: ["guildchannnellist", "lsguildchan"],
                quoted: true,
                args: []
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, never>): Promise<void> {
        this.getBotgartClient().getTS3Connection().get("guild/channels", {})
            .then(res => {
                const resJson = JSON.parse(res);
                const data: string[][] = [];
                if (Array.isArray(resJson)) {
                    for (const row of resJson) {
                        data.push([row["name"], row["empty_since"]]);
                    }
                }
                const table = createTable(["guild", "empty for"], data);
                const attachment = new discord.MessageAttachment(Buffer.from(table, CHARSET), ATTACHMENT_NAME);
                return message.reply({ content: L.get("DESC_GUILD_CHAN"), files: [attachment] });
            });
    }
}

module.exports = GuildChannelList;