import {configuration} from "../config/Config";
import * as L from "../Locale";
import * as discord from "discord.js";
import {BotgartCommand} from "../BotgartCommand";


/**
Testcases:

*/
export class DeleteTsRegistration extends BotgartCommand {
    constructor() {
        super("deletetsregistration", {
            aliases: ["deletetsregistration", "rmtsreg"],
            quoted: true,
            args: [
                {
                    id: "gw2account",
                    type: "string"
                }
            ]
        }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const gw2account: string = args.gw2account;
        if(configuration.get().ts_unregister_protection.includes(gw2account)) {
            this.reply(message, responsible, L.get("TS_UNREGISTER_PROTECTION"));
        } else {
            this.getBotgartClient().getTS3Connection().delete("user", {"gw2account": gw2account});
            this.reply(message, responsible, L.get("TS_UNREGISTER_SENT"));
            // FIXME: feedback
        }
    }
}

module.exports = DeleteTsRegistration;
