import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import * as Util from "../../Util";

/**
Testcases:

*/

export class AddPermanentRole extends BotgartCommand {
    constructor() {
        super("addpermanentrole", {
            aliases: ["addpermarole","addpermanentrole","addprole"],
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
            userPermissions: ["ADMINISTRATOR"]

        }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(!message) {
            Util.log("error", "Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }

        // command not available as DM, so we can safely cast message.guild to discord.Guild everywhere.
        const cl = <BotgartClient>this.client;
        const success = cl.permanentRoleRepository.storePermanentRole(args.member.user.id, (<discord.Guild>message.guild).id, args.role.name);

        if(success) {
            Util.log("info", "Successfully added role {0} to user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, (<discord.Guild>message.guild).name));
            message.util?.send(L.get("PERMANENT_ROLE_ADD_SUCC"));
        } else {
            Util.log("info", "Could not add role {0} to user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, (<discord.Guild>message.guild).name));
            message.util?.send(L.get("PERMANENT_ROLE_ADD_FAIL"));
        }
    }
}

module.exports = AddPermanentRole;