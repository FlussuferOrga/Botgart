import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";
import { logger } from "../util/Logging";

const LOG = logger();

/**
 Testcases:
 - missing parameters -> error
 - regular use -> reauth success
 - remove a formerly valid API key with user still in guild -> key gets unauthenticated, user gets his auth role removed
 - remove a formerly valid API key with user no longer in guild -> key gets unauthenticated
 - cron: all of the above -> reauth success
 */
export class Reauthenticate extends BotgartCommand {
    constructor() {
        super(
            "reauthenticate",
            {
                aliases: ["reauthenticate", "reauth", "revalidate"],
                // userPermissions: ['ADMINISTRATOR']
            },
            {
                cronable: true,
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, sguild: discord.Guild, args) {
        const cl: BotgartClient = this.getBotgartClient();
        LOG.info("Starting Re-authentication.");
        await cl.revalidationService.revalidateKeys();
        return message.reply(L.get("PRUNING_COMPLETE"));
    }
}

module.exports = Reauthenticate;
