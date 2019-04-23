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
- create faq properly -> faq is now present in db and available for ,faq
- use multiple keys -> faq is present in db unter multiply names
- use already existing keys -> faq is now overridden
- missing parameters -> error
*/
class MakeFAQCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("addfaq", {
            aliases: ["addfaq", "addrtfm"],
            split: "quoted",
            args: [
                {
                    id: "keys",
                    type: es => es ? es.split(";").filter(e => e) : []
                },
                {
                    id: "text",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        true // cronable
        );
    }
    desc() {
        return L.get("DESC_ADD_FAQ");
    }
    checkArgs(args) {
        return !args || !args.keys || !args.text || args.keys.length < 1 ? L.get("HELPTEXT_ADD_FAQ") : undefined;
    }
    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        assertType(args.keys, "Array");
        assertType(args.text, "String");
        this.client.db.storeFAQ(responsible.id, guild.id, args.keys, args.text);
        if (message) {
            message.util.send(L.get("FAQ_STORED"));
        }
        else {
            responsible.send(L.get("FAQ_STORED"));
        }
    }
}
module.exports = MakeFAQCommand;
