import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { BotgartCommand } from "../../../BotgartCommand";
import * as L from "../../../Locale";
import * as Util from "../../../util/Util";
import * as ResetUtil from "../ResetUtil";
import { WvwMap } from "../WvwMap";

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
                        default: -1
                    }
                ]
            }
        );
    }

    checkArgs(args) {
        return !args || !args.weekNumber || !args.player ? L.get(this.helptextKey(), [WvwMap.getMaps().map(m => m.name).join(" | ")]) : undefined;
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
            const [g, mes, roster] = dbRoster;
            const name: string = args.player instanceof discord.GuildMember ? Util.formatUserPing(args.player.id) : args.player;
            roster.removeLeadByName(WvwMap.getMapByName(args.map), name);
            await this.reply(message, responsible, L.get("ROSTER_LEAD_REMOVED", [name, args.weekNumber, mes.url]));
        }
    }
}

module.exports = RemoveResetLeader;