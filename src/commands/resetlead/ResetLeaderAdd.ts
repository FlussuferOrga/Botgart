import * as Util from "../../Util";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import { WvWMap } from "./ResetRoster";

/**
Testcases:

*/
export class AddResetLeader extends BotgartCommand {
     constructor() {
        super("addresetlead", {
            aliases: ["addresetlead"],
            quoted: true,
            args: [
                {
                    id: "player",
                    type: "string"
                },
                {
                    id: "map",
                    type: (message: discord.Message, phrase: string) => WvWMap.getAllMapNames().includes(phrase) ? phrase : null
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
        }
        );
    }

    checkArgs(args) {
        return !args || !args.weekNumber || !args.year || !args.player || !args.map 
                ? L.get(this.helptextKey(), [WvWMap.getAllMapNames().join(" | ")]) 
                : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const dbRoster = this.getBotgartClient().getRoster(guild, args.weekNumber, args.year);
        if(dbRoster !== undefined) {
            const [g,mes,roster] = dbRoster;
            roster.addLead(WvWMap.getMapByName(args.map), args.player);
            this.reply(message, responsible, L.get("ROSTER_LEAD_ADDED", [args.player, args.map, args.weekNumber, mes.url]));
        }
    }
}

module.exports = AddResetLeader;