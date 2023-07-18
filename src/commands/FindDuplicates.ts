import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import * as L from "../Locale.js";
import { logger } from "../util/Logging.js";
import { chunk } from "lodash-es";
import { GuildMember } from "discord.js";

const LOG = logger();

export default class FindDuplicates extends BotgartCommand {
    constructor() {
        super("findduplicates", {
            aliases: ["findduplicates", "finddupes"],
            channel: "guild",
            // userPermissions: ['ADMINISTRATOR']
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const cl = this.getBotgartClient();
        const accountsWithMultipleUsers = await cl.registrationRepository.findDuplicateRegistrations(guild.id);
        const map = await Promise.all(
            accountsWithMultipleUsers.map(async (value) => {
                const users: GuildMember[] = await Promise.all(value.users.map(async (u) => await guild.members.fetch(u)).filter((u) => u));
                return `${value.account_names.map((v) => `\`${v}\``).join(",")}: ${users.join(", ")}`;
            })
        );

        for (const msgChunk of chunk(map, 10)) {
            await message.reply(`_ _\n${msgChunk.join("\n")}`);
        }

        LOG.info("Finding duplicates complete.");
        await message.reply(L.get("FIND_DUPLICATES_COMPLETE"));
    }
}
