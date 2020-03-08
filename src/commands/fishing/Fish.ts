import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:

*/
export class Fish extends BotgartCommand {
     constructor() {
        super("fish", {
            aliases: ["fish"],
            split: "quoted",
        },
        true,  // available per DM
        false // cronable
        );
    }

    checkArgs(args) {
        return undefined;
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

module.exports = AddResetLeader;