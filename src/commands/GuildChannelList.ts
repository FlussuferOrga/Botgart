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
        let response = await this.getBotgartClient().guildsApi.guildChannelList();
        const data: string[][] = [];
        if (Array.isArray(response)) {
            for (const row of response) {
                data.push([row.name, row.emptySince]);
            }
        }
        const table = createTable(["Guild", "Empty since"], data);
        const attachment = new discord.AttachmentBuilder(Buffer.from(table, CHARSET)).setName(ATTACHMENT_NAME);
        await message.reply({ content: L.get("DESC_GUILD_CHAN"), files: [attachment] });
    }
}
