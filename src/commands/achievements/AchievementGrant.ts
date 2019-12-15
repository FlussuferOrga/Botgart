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
export class AchievementGrant extends BotgartCommand {
     constructor() {
        super("grantachievement", {
            aliases: ["gachievement"],
            split: "quoted",
            args: [
                {
                    id: "player",
                    type: "string" //type: (word: string, message: discord.Message, prevArgs: any[]) => message.guild.members.find(m => m.)
                },
                {
                    id: "achievement",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => this.getBotgartClient().getAchievement(word)
                },
                {
                    id: "timestamp",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => moment.utc(word),
                    default: moment.utc()
                }
            ]
        },
        false,  // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_GRANT_ACHIEVEMENT");
    }

    checkArgs(args) {
        return !args || !args.player || !args.achievement || !args.timestamp
                ? L.get("HELPTEXT_GRANT_ACHIEVEMENT") 
                : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
  
    }
}

module.exports = AchievementGrant;