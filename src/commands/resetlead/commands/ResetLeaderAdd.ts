import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { BotgartCommand } from "../../../BotgartCommand.js";
import * as L from "../../../Locale.js";
import * as Util from "../../../util/Util.js";
import * as ResetUtil from "../ResetUtil.js";
import { WvwMap } from "../WvwMap.js";

/**
 Testcases:

 */
export default class AddResetLeader extends BotgartCommand {
    constructor() {
        super("addresetlead", {
            aliases: ["addresetlead"],
            quoted: true,
            channel: "guild",
            args: [
                {
                    id: "player",
                    type: akairo.Argument.union("member", "string"),
                },
                {
                    id: "map",
                    type: (message: discord.Message, phrase: string) => (WvwMap.getAllMapNames().includes(phrase) ? phrase : null),
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

    checkArgs(args) {
        return !args?.weekNumber || !args.year || !args.player || !args.map
            ? L.get(this.helptextKey(), [WvwMap.getAllMapNames().join(" | ")])
            : undefined;
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
            roster.addLeadByName(WvwMap.getMapByName(args.map), name);
            await this.reply(message, responsible, L.get("ROSTER_LEAD_ADDED", [args.player, args.map, args.weekNumber, mes.url]));
        }
    }
}
