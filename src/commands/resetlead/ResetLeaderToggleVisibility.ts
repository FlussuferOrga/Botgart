import * as Util from "../../Util";
import * as L from "../../Locale";
import * as discord from "discord.js";
import * as akairo from "discord-akairo";
import { BotgartCommand } from "../../BotgartCommand";
import { WvWMap } from "./ResetRoster";

/**
Testcases:

*/
export class ToggleResetLeaderVisibility extends BotgartCommand {
     constructor() {
        super("toggleresetleadervisibility", {
            aliases: ["toggleresetleadervisibility"],
            quoted: true,
            args: [
                {
                    id: "player",
                    type: akairo.Argument.union("member", "string")
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

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const dbRoster = this.getBotgartClient().getRoster(guild, args.weekNumber, args.year);
        if(dbRoster !== undefined) {
            const [g, mes, roster] = dbRoster;
            const name: string = args.player instanceof discord.GuildMember ? Util.formatUserPing(args.player.id) : args.player;
            roster.toggleLeaderVisibility(name)
            this.reply(message, responsible, L.get("ROSTER_LEAD_VISIBILITY_TOGGLED", [name, args.weekNumber, mes.url]));
        }
    }
}

module.exports = ToggleResetLeaderVisibility;