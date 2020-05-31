const config = require("../../../config.json")
import { log } from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartCommand, PermissionTypes } from "../../BotgartCommand";
import { BotgartClient } from "../../BotgartClient";

/**
Testcases:

*/
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

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        this.getBotgartClient().getTS3Connection().delete("guild", { name: args.guildName });
        this.reply(message, responsible, L.get("RM_GUILD_COMPLETE"));
    }
}

module.exports = TsGuildDelete;
