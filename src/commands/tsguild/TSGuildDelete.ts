import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand.js";
import * as L from "../../Locale.js";

export default class TsGuildDelete extends BotgartCommand {
    constructor() {
        super("tsguilddelete", {
            aliases: ["tsguilddelete", "rmguild", "deleteguild"],
            quoted: true,
            args: [
                {
                    id: "guildName",
                    type: (message: discord.Message, phrase: string) =>
                        phrase
                            .split(" ")
                            .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                            .join(" "),
                },
            ],
        });
    }

    async command(
        message: discord.Message,
        responsible: discord.User,
        guild: discord.Guild,
        args: {
            guildName: string;
        }
    ): Promise<void> {
        const response = await this.getBotgartClient().guildsApi.guildDelete({ guildDeleteRequest: { name: args.guildName } });
        await message.reply(L.get("HTTP_REQUEST_RETURNED", [response]));
        await message.reply(L.get("RM_GUILD_COMPLETE"));
    }
}
