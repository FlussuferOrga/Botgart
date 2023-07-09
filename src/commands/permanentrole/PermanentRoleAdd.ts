import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { logger } from "../../util/Logging";

const LOG = logger();

/**
 Testcases:

 */

export class AddPermanentRole extends BotgartCommand {
    constructor() {
        super("addpermanentrole", {
            aliases: ["addpermarole", "addpermanentrole", "addprole"],
            args: [
                {
                    id: "member",
                    type: "member",
                },
                {
                    id: "role",
                    type: "role",
                },
            ],
            // userPermissions: ["ADMINISTRATOR"]
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        if (!message) {
            LOG.error("Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }

        // command not available as DM, so we can safely cast message.guild to discord.Guild everywhere.
        const cl = this.client as BotgartClient;
        const roleName = args.role.name;
        const user = args.member.user;
        const messageGuild = message.guild as discord.Guild;
        const success = await cl.permanentRoleRepository.storePermanentRole(user.id, messageGuild.id, roleName);

        const guildName = messageGuild.name;
        if (success) {
            LOG.info("Successfully added role {0} to user {0} in guild {0}.".formatUnicorn(roleName, user.username, guildName));
            await message.reply(L.get("PERMANENT_ROLE_ADD_SUCC"));
        } else {
            LOG.info("Could not add role {0} to user {0} in guild {0}.".formatUnicorn(roleName, user.username, guildName));
            await message.reply(L.get("PERMANENT_ROLE_ADD_FAIL"));
        }
    }
}

module.exports = AddPermanentRole;
