import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { createTable } from "../util/Table.js";
import * as L from "../Locale.js";
import { GuildChannelStats } from "../generated/api/botgerda/index.js";
import { sortBy } from "lodash-es";

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
            const sortedList = sortBy(list, "name"); // Sort channels alphabetically by name
            for (let i = 0; i < sortedList.length; i++) {
                const row = sortedList[i];
                const prefix = " ".repeat(indent);
                const isLast = i === sortedList.length - 1;
                const branchSymbol = isLast ? "└── " : "├── ";
                const name = prefix + branchSymbol + row.name;
                data.push([name, row.emptySince]);
                this.generate(row.subChannels, data, indent + 1);
            }
        }
    }
}
