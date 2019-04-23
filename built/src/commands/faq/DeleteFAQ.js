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
- use proper key for existing faq with multiple keys -> key is properly removed, but faq still available
- use proper key for existing faq with only one key left -> key is removed as well as whole faq
- use key that doesn't exist -> user receives corresponding feedback
- cron: all of the above
*/
class DeleteFAQCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("deletefaq", {
            aliases: ["deletefaq", "deletertfm", "rmfaq", "rmrtfm"],
            args: [
                {
                    id: "key",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        true // cronable
        );
    }
    desc() {
        return L.get("DESC_DEL_FAQ");
    }
    checkArgs(args) {
        return !args || !args.key ? L.get("HELPTEXT_DEL_FAQ") : undefined;
    }
    command(message, responsible, guild, args) {
        let deleted = this.client.db.deleteFAQ(args.key, guild.id);
        let reply = deleted ? L.get("FAQ_DELETED").formatUnicorn(args.key) : L.get("FAQ_NOT_DELETED").formatUnicorn(args.key);
        this.reply(message, responsible, reply);
        return deleted;
    }
}
exports.DeleteFAQCommand = DeleteFAQCommand;
