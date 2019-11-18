import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import { WvWMap } from "./ResetRoster";

/**
Testcases:

*/
export class AddResetLeaderCommand extends BotgartCommand {
     constructor() {
        super("addresetlead", {
            aliases: ["addresetlead"],
            split: "quoted",
            args: [
                {
                    id: "player",
                    type: "string"
                },
                {
                    id: "map",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => WvWMap.getAllMapNames().includes(word)
                },
                {
                    id: "weekNumber",
                    type: "integer",
                    default: -1
                },
                {
                    id: "year",
                    type: "integer",
                    default: new Date().getFullYear()
                }
            ]
        },
        false,  // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_ADD_RESETLEAD");
    }

    checkArgs(args) {
        return !args || !args.weekNumber || !args.year || !args.player || !args.map 
                ? L.get("HELPTEXT_ADD_RESETLEAD", [WvWMap.getAllMapNames().join(" | ")]) 
                : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const [g,mes,roster] = this.getBotgartClient().getRoster(guild, args.weekNumber, args.year);
        if(roster !== undefined) {
            roster.addLead(WvWMap.getMapByName(args.map), args.player);
            this.reply(message, responsible, L.get("ROSTER_LEAD_ADDED", [args.player, args.map, args.weekNumber, mes.url]));
        }
    }
}

module.exports = AddResetLeaderCommand;