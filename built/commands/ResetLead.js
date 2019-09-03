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
const L = __importStar(require("../Locale"));
const discord = __importStar(require("discord.js"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class ResetLeadCommand extends BotgartCommand_1.BotgartCommand {
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
        }, false, // available per DM
        true // cronable
        );
    }
    init(cl) {
        console.log("REG");
        this.client.on("messageReactionAdd", (mr, u) => {
            console.log("REACT");
            console.log(mr);
        });
    }
    desc() {
        return L.get("DESC_RESETLEAD");
    }
    checkArgs(args) {
        return !args || !args.channel || !(args.channel instanceof discord.TextChannel) ? L.get("HELPTEXT_RESETLEAD") : undefined;
    }
    command(message, responsible, guild, args) {
    }
}
exports.ResetLeadCommand = ResetLeadCommand;
module.exports = ResetLeadCommand;
