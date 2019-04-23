"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const L = __importStar(require("../../Locale"));
const BotgartCommand_1 = require("../../BotgartCommand");
/**
Testcases:
- missing key -> feedback to user
- existing key -> bot posts corresponding faq
- non-existing key -> feedback to user
*/
class GetFAQCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("getfaq", {
            aliases: ["getfaq", "faq", "getrtfm", "rtfm"],
            args: [
                {
                    id: "key",
                    type: "string"
                }
            ]
        }, false, // available per DM
        true // cronable
        );
    }
    desc() {
        return L.get("DESC_GET_FAQ");
    }
    checkArgs(args) {
        return !args || !args.key ? L.get("HELPTEXT_GET_FAQ") : undefined;
    }
    command(message, responsible, guild, args) {
        let faq = this.client.db.getFAQ(args.key, guild.id);
        let response = faq ? faq.text : L.get("FAQ_NOT_FOUND").formatUnicorn(args.key);
        this.reply(message, responsible, response);
    }
}
exports.GetFAQCommand = GetFAQCommand;
module.exports = GetFAQCommand;
