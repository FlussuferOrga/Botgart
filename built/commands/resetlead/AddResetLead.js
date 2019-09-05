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
const ResetLead_1 = require("./ResetLead");
/**
Testcases:

*/
class AddResetLeadCommand extends BotgartCommand_1.BotgartCommand {
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
                    type: "integer",
                    default: -1
                },
                {
                    id: "map",
                    type: (word, message, prevArgs) => {
                        return ResetLead_1.WvWMap.getMapNames().includes(word) ? word : undefined;
                    }
                },
            ]
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_ADD_RESETLEAD");
    }
    checkArgs(args) {
        return !args || !args.weekNumber || !args.player || !args.map ? L.get("HELPTEXT_ADD_RESETLEAD") : undefined;
    }
    command(message, responsible, guild, args) {
        if (args.weekNumber < 0) {
            args.weekNumber = Util.getNumberOfWeek();
        }
    }
}
exports.AddResetLeadCommand = AddResetLeadCommand;
module.exports = AddResetLeadCommand;
