import * as discord from "discord.js";
import {BotgartCommand} from "../BotgartCommand";
import * as L from "../Locale";
import {logger} from "../util/Logging";
import {chunk} from "lodash";
import {GuildMember} from "discord.js";

const LOG = logger();

export class FindDuplicates extends BotgartCommand {
    constructor() {
        super("findduplicates", {
            aliases: ["findduplicates", "finddupes"],
            // userPermissions: ['ADMINISTRATOR']
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const cl = this.getBotgartClient();
        const accountsWithMultipleUsers = await cl.registrationRepository.findDuplicateRegistrations(guild.id);
        let map = await Promise.all(accountsWithMultipleUsers.map(async value => {
            let users: GuildMember[] = await Promise.all(value.users.map(async (u) => await guild.members.fetch(u)).filter((u) => u));
            return `${value.account_names.map(v => `\`${v}\``).join(",")}: ${users.join(", ")}`
        }));

        for (let msgChunk of chunk(map, 10)) {
            await message.reply(`_ _\n${msgChunk.join("\n")}`)
        }

        LOG.info("Finding duplicates complete.");
        await message.reply(L.get("FIND_DUPLICATES_COMPLETE"));
    }

}

module.exports = FindDuplicates;
