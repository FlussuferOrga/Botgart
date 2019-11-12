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

export class PermanentRoleRemoveCommand extends BotgartCommand {
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

        },
        false,  // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_RM_PERMAROLE");
    }

    checkArgs(args) {
        return !args || !args.member || !args.role ? L.get("HELPTEXT_RM_PERMAROLE") : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(!message) {
            Util.log("error", "PermanentRoleRemove.js", "Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }

        let cl = <BotgartClient>this.client;
        let success = cl.db.deletePermanentRole(args.member.user.id, message.guild.id, args.role.name);

        if(success) {
            Util.log("info", "PermanentRoleRemove.js", "Successfully removed role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_RM_SUCC"));
        } else {
            Util.log("info", "PermanentRoleRemove.js", "Could not remove role {0} from user {0} in guild {0}.".formatUnicorn(args.role.name, args.member.user.username, message.guild.name));
            message.util.send(L.get("PERMANENT_ROLE_RM_FAIL"));
        }
    }
}

module.exports = PermanentRoleRemoveCommand;