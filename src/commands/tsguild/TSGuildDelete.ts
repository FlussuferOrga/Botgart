import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";

export class TsGuildDelete extends BotgartCommand {
    constructor() {
        super("tsguilddelete", {
                aliases: ["tsguilddelete", "rmguild", "deleteguild"],
                quoted: true,
                args: [
                    {
                        id: "guildName",
                        type: (message: discord.Message, phrase: string) => phrase.split(" ")
                            .map(t => t.charAt(0).toUpperCase() + t.slice(1))
                            .join(" ")
                    }
                ]
            }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: { guildName: string }): void {
        this.getBotgartClient().getTS3Connection().delete("guild", { name: args.guildName })
            .then(res => message.reply(L.get("HTTP_REQUEST_RETURNED", [JSON.stringify(res)])));
        this.reply(message, responsible, L.get("RM_GUILD_COMPLETE"));
    }
}

module.exports = TsGuildDelete;