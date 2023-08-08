import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { logger } from "../util/Logging.js";

const LOG = logger();

/**
 Testcases:
 - run without any changes -> nothing happens (no output either)
 - remove role from user manually after registration -> users should get their roles back (output on console)
 - remove role from server -> error on console
 */
export default class RepairRoles extends BotgartCommand {
    public constructor() {
        super(
            "repairroles",
            {
                aliases: ["repairroles", "rolerepair"],
                channel: "guild",

                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: true,
            }
        );
    }

    public async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, unknown>): Promise<void> {
        // noinspection ES6MissingAwait
        await this.getBotgartClient().validationService.repairRoles(guild);
        LOG.info("Done repairing roles");
        await message.react("✅");
    }
}
