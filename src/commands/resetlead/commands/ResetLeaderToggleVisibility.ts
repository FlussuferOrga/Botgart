import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { BotgartCommand } from "../../../BotgartCommand";
import * as L from "../../../Locale";
import * as Util from "../../../util/Util";
import * as ResetUtil from "../ResetUtil";

/**
 Testcases:

 */
export class ToggleResetLeaderVisibility extends BotgartCommand {
    constructor() {
        super("toggleresetleadervisibility", {
            aliases: ["toggleresetleadervisibility"],
            quoted: true,
            channel: "guild",
            args: [
                {
                    id: "player",
                    type: akairo.Argument.union("member", "string"),
                },
                {
                    id: "weekNumber",
                    type: "integer",
                    default: -1,
                },
                {
                    id: "year",
                    type: "integer",
                    default: -1,
                },
            ],
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        if (args.weekNumber <= 0) {
            args.weekNumber = ResetUtil.currentWeek();
        }
        if (args.year <= 0) {
            args.year = ResetUtil.currentYear();
        }
        const dbRoster = this.getBotgartClient().rosterService.getCachedRoster(guild, args.weekNumber, args.year);
        if (dbRoster !== undefined) {
            const [, mes, roster] = dbRoster;
            const name: string = args.player instanceof discord.GuildMember ? Util.formatUserPing(args.player.id) : args.player;
            roster.toggleLeaderVisibility(name);
            this.reply(message, responsible, L.get("ROSTER_LEAD_VISIBILITY_TOGGLED", [name, args.weekNumber, mes.url]));
        }
    }
}

module.exports = ToggleResetLeaderVisibility;
