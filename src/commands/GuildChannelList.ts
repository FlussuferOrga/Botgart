import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { createTable } from "../util/Table.js";
import * as L from "../Locale.js";

const CHARSET = "utf-8";
const ATTACHMENT_NAME = "result.txt";

export default class GuildChannelList extends BotgartCommand {
    constructor() {
        super("guildchannnellist", {
            aliases: ["guildchannnellist", "lsguildchan"],
            quoted: true,
            args: [],
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, never>): Promise<void> {
        this.getBotgartClient()
            .getTS3Connection()
            .get("guild/channels", {})
            .then((res) => {
                const resJson = JSON.parse(res);
                const data: string[][] = [];
                if (Array.isArray(resJson)) {
                    for (const row of resJson) {
                        data.push([row["name"], row["empty_since"]]);
                    }
                }
                const table = createTable(["guild", "empty for"], data);
                const attachment = new discord.AttachmentBuilder(Buffer.from(table, CHARSET)).setName(ATTACHMENT_NAME);
                return message.reply({ content: L.get("DESC_GUILD_CHAN"), files: [attachment] });
            });
    }
}
