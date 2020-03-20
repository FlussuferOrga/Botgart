import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import * as moment from "moment";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:

*/
export class ListAchievements extends BotgartCommand {
     constructor() {
        super("listachievements", {
            aliases: ["lsachievements"],
            quoted: true,
            args: []
        },
        true,  // available per DM
        false // cronable
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        message.reply(this.getBotgartClient().getAchievements()
                          .map(a => `\`${a.name}\`: ${a.getDescription()}`)
                          .join("\n")
                      , {"split": true});
    }
}

module.exports = ListAchievements;