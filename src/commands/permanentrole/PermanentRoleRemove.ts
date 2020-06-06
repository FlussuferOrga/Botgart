import { Command } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:

*/

export class RemovePermanentRole extends BotgartCommand {
    constructor() {
        super("removepermanentrole", {
            aliases: ["removepermarole","removepermanentrole","rmprole"],
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

        let cl = <BotgartClient>this.client;
        let success = cl.db.deletePermanentRole(args.member.user.id, message.guild.id, args.role.name);

        if(success) {
            Util.log("info", "Successfully removed role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_RM_SUCC"));
        } else {
            Util.log("info", "Could not remove role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_RM_FAIL"));
        }
    }
}

module.exports = RemovePermanentRole;