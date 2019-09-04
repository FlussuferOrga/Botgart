let config = require.main.require("../config.json");
import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import { WvWMap } from "./ResetLead";

/**
Testcases:

*/
export class AddResetLeadCommand extends BotgartCommand {
 
    constructor() {
        super("addresetlead", {
            aliases: ["addresetlead"],
            args: [
                {
                    id: "weekNumber",
                    type: "integer",
                    default: undefined
                },
                {
                    id: "player",
                    type: "string"
                },
                {
                    id: "weekNumber",
                    type: "integer"
                },
                {
                    id: "map",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => { 
                        return WvWMap.getMapNames().includes(word) ? word : undefined;
                    }
                },
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
        return !args || !args.weekNumber || !args.player || !args.map ? L.get("HELPTEXT_ADD_RESETLEAD") : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        
    }
}

module.exports = AddResetLeadCommand;