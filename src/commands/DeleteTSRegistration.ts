const config = require("../../config.json")
import { Command, Argument } from "discord-akairo";
import { log } from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartCommand, PermissionTypes } from "../BotgartCommand";
import { BotgartClient } from "../BotgartClient";

/**
Testcases:

*/
export class DeleteTsRegistration extends BotgartCommand {
    constructor() {
        super("deletetsregistration", {
            aliases: ["rmtsreg"],
            quoted: true,
            args: [
                {
                    id: "gw2account",
                    type: "string"
                }
            ]
        },
        false, // available per DM
        true, // cronable
        0
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const gw2account: string = args.gw2account;
        if(config.ts_unregister_protection.includes(gw2account)) {
            this.reply(message, responsible, L.get("TS_UNREGISTER_PROTECTION"));
        } else {
            this.getBotgartClient().getTS3Connection().delete("user", {"gw2account": gw2account});
            this.reply(message, responsible, L.get("TS_UNREGISTER_SENT"));
            // FIXME: feedback
        }
    }
}

module.exports = DeleteTsRegistration;
