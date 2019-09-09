let config = require.main.require("../config.json");
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
export class ResetLeaderRemoveCommand extends BotgartCommand {
     constructor() {
        super("removeresetlead", {
            aliases: ["removeresetlead", "rmresetlead"],
            args: [
                {
                    id: "player",
                    type: "string"
                },
                {
                    id: "weekNumber",
                    type: "integer",
                    default: -1
                }
            ]
        },
        false,  // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_REMOVE_RESETLEAD");
    }

    checkArgs(args) {
        return !args || !args.weekNumber || !args.player ? L.get("HELPTEXT_REMOVE_RESETLEAD", [WvWMap.getMaps().map(m => m.name).join(" | ")]) : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const [g,mes,roster] = this.getBotgartClient().getRoster(args.weekNumber);
        if(roster !== undefined) {
            roster.removeLead(WvWMap.getMapByName(args.map), args.player);
            this.reply(message, responsible, L.get("ROSTER_LEAD_REMOVED", [args.player, args.weekNumber, mes.url]));
        }
    }
}

module.exports = ResetLeaderRemoveCommand;