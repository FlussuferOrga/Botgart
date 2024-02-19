import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { createTable } from "../util/Table.js";
import * as L from "../Locale.js";
import { GuildChannelStats } from "../generated/api/botgerda/index.js";

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
        const response = await this.getBotgartClient().guildsApi.guildChannelList();
        const data: string[][] = [];
        if (Array.isArray(response)) {
            this.generate(response, data);
        }
        const table = createTable(["Guild", "Empty since"], data);
        const attachment = new discord.AttachmentBuilder(Buffer.from(table, CHARSET)).setName(ATTACHMENT_NAME);
        await message.reply({ content: L.get("DESC_GUILD_CHAN"), files: [attachment] });
    }

    private generate(list: GuildChannelStats[] | null | undefined, data: string[][], indent = 0) {
        if (Array.isArray(list)) {
            for (let i = 0; i < list.length; i++) {
                const row = list[i];
                let name: string;
                let prefix = "  ".repeat(indent);
                if (i == list.length - 1) {
                    name = prefix + (indent > 0 ? "└──" : "") + row.name;
                } else {
                    name = prefix + (indent > 0 ? "├──" : "") + row.name;
                }
                data.push([name, row.emptySince]);
                this.generate(row.subChannels, data, indent + 1);
            }
        }
    }
}
