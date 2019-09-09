"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const Util = __importStar(require("../../Util"));
const L = __importStar(require("../../Locale"));
const BotgartCommand_1 = require("../../BotgartCommand");
const ResetRoster_1 = require("./ResetRoster");
/**
Testcases:

*/
class ResetLeaderRemoveCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("removeresetlead", {
            aliases: ["rmresetlead"],
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
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_REMOVE_RESETLEAD");
    }
    checkArgs(args) {
        return !args || !args.weekNumber || !args.player ? L.get("HELPTEXT_REMOVE_RESETLEAD", [ResetRoster_1.WvWMap.getMaps().map(m => m.name).join(" | ")]) : undefined;
    }
    command(message, responsible, guild, args) {
        if (args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const [g, mes, roster] = this.getBotgartClient().getRoster(args.weekNumber);
        if (roster !== undefined) {
            roster.removeLead(ResetRoster_1.WvWMap.getMapByName(args.map), args.player);
            this.reply(message, responsible, L.get("ROSTER_LEAD_REMOVED", [args.player, args.weekNumber, mes.url]));
        }
    }
}
exports.ResetLeaderRemoveCommand = ResetLeaderRemoveCommand;
module.exports = ResetLeaderRemoveCommand;
