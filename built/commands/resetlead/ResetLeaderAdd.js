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
class AddResetLeaderCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("addresetlead", {
            aliases: ["addresetlead"],
            args: [
                {
                    id: "player",
                    type: "string"
                },
                {
                    id: "map",
                    type: (word, message, prevArgs) => ResetRoster_1.WvWMap.getMapNames().includes(word)
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
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_ADD_RESETLEAD");
    }
    checkArgs(args) {
        return !args || !args.weekNumber || !args.year || !args.player || !args.map ? L.get("HELPTEXT_ADD_RESETLEAD", [ResetRoster_1.WvWMap.getMaps().map(m => m.name).join(" | ")]) : undefined;
    }
    command(message, responsible, guild, args) {
        if (args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
        const [g, mes, roster] = this.getBotgartClient().getRoster(args.weekNumber, args.year);
        if (roster !== undefined) {
            roster.addLead(ResetRoster_1.WvWMap.getMapByName(args.map), args.player);
            this.reply(message, responsible, L.get("ROSTER_LEAD_ADDED", [args.player, args.map, args.weekNumber, mes.url]));
        }
    }
}
exports.AddResetLeaderCommand = AddResetLeaderCommand;
module.exports = AddResetLeaderCommand;
