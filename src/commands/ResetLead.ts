let config = require.main.require("../config.json");
import { Command, Listener } from "discord-akairo";
import * as Util from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:

*/

export class ResetLeadCommand extends BotgartCommand {
    constructor() {
        super("resetlead", {
            aliases: ["resetlead"],
            args: [
                {
                    id: "channel",
                    type: "channel"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]

        },
        false,  // available per DM
        true // cronable
        );
    }

    init(cl: BotgartClient): void {
        console.log("REG");
        this.client.on("messageReactionAdd", (mr,u) => {
            console.log("REACT");
            console.log(mr);
        });
    }

    desc(): string {
        return L.get("DESC_RESETLEAD");
    }

    checkArgs(args) {
        return !args || !args.channel || !(args.channel instanceof discord.TextChannel) ? L.get("HELPTEXT_RESETLEAD") : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {

    }
}

module.exports = ResetLeadCommand;