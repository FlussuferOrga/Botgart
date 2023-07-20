import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { getConfig } from "../config/Config.js";
import * as L from "../Locale.js";

/**
 Testcases:

 */
export default class DeleteTsRegistration extends BotgartCommand {
    constructor() {
        super("deletetsregistration", {
            aliases: ["deletetsregistration", "rmtsreg"],
            quoted: true,
            args: [
                {
                    id: "gw2account",
                    type: "string",
                },
            ],
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: { gw2account: string }): Promise<void> {
        const gw2account: string = args.gw2account;
        if (getConfig().get().ts_unregister_protection.includes(gw2account)) {
            await this.reply(message, responsible, L.get("TS_UNREGISTER_PROTECTION"));
        } else {
            const response = await this.getBotgartClient().registrationApi.registrationDelete({
                registrationDeleteRequest: { gw2account: gw2account },
            });
            await message.reply(L.get("TS_REGISTRATIONS_DELETED", [(response.changes || 0).toString()]));
        }
    }
}
