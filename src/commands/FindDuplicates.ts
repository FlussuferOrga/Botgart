import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";
import { logger } from "../util/Logging";

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
        accountsWithMultipleUsers.forEach((dup) => {
            // unknown users are already filtered out. Maybe we want to change that and notify the caller
            Promise.all(dup.users.map(async (u) => guild.members.fetch(u)).filter((u) => u)).then((users) =>
                message.reply(`${dup.gw2account}: ${users.join(", ")}`)
            );
        });
        LOG.info("Finding duplicates complete.");
    }

    postExecHook(message: discord.Message, args: Record<string, unknown>, result): void {
        message.reply(L.get("FIND_DUPLICATES_COMPLETE"));
    }
}

module.exports = FindDuplicates;
