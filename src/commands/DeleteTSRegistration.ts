import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { getConfig } from "../config/Config";
import * as L from "../Locale";


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

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: { gw2account: string }): void {
        const gw2account: string = args.gw2account;
        if (getConfig().get().ts_unregister_protection.includes(gw2account)) {
            this.reply(message, responsible, L.get("TS_UNREGISTER_PROTECTION"));
        } else {
            this.getBotgartClient().getTS3Connection().delete("registration", {"gw2account": gw2account})
                .then(res => {
                    const data: { changes?: number } = JSON.parse(res);
                    const changes: number = data?.changes ? data.changes : 0;
                    return message.reply(L.get("TS_REGISTRATIONS_DELETED", [changes.toString()]));
                });
            message.reply(L.get("TS_UNREGISTER_SENT"));
        }
    }
}

module.exports = DeleteTsRegistration;
