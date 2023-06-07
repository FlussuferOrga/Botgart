import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { logger } from "../../util/Logging";

const LOG = logger();

/**
 Testcases:

 */

export class RemovePermanentRole extends BotgartCommand {
    constructor() {
        super("removepermanentrole", {
                aliases: ["removepermarole", "removepermanentrole", "rmprole"],
                args: [
                    {
                        id: "member",
                        type: "member"
                    },
                    {
                        id: "role",
                        type: "role"
                    }
                ],
                // userPermissions: ["ADMINISTRATOR"]

            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        if (!message?.guild) {
            LOG.error("Mandatory message parameter missing or it is a direct message. This command can not be issued as cron.");
            return;
        }

        const cl = this.client as BotgartClient;
        const success = cl.permanentRoleRepository.deletePermanentRole(args.member.user.id, message.guild.id, args.role.name);

        if (success) {
            LOG.info("Successfully removed role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.reply(L.get("PERMANENT_ROLE_RM_SUCC"));
        } else {
            LOG.info("Could not remove role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.reply(L.get("PERMANENT_ROLE_RM_FAIL"));
        }
    }
}

module.exports = RemovePermanentRole;