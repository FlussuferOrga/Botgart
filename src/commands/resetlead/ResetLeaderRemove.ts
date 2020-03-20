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
export class RemoveResetLeader extends BotgartCommand {
     constructor() {
        super("removeresetlead", {
            aliases: ["removeresetlead", "rmresetlead"],
            quoted: true,
            args: [
                {
                    id: "player",
                    type: "string"
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

    checkArgs(args) {
        return !args || !args.weekNumber || !args.player ? L.get(this.helptextKey(), [WvWMap.getMaps().map(m => m.name).join(" | ")]) : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const [g,mes,roster] = this.getBotgartClient().getRoster(guild, args.weekNumber, args.year);
        if(roster !== undefined) {
            roster.removeLead(WvWMap.getMapByName(args.map), args.player);
            this.reply(message, responsible, L.get("ROSTER_LEAD_REMOVED", [args.player, args.weekNumber, mes.url]));
        }
    }
}

module.exports = RemoveResetLeader;