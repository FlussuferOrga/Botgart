"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class WhoisCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("whois", {
            aliases: ["whois"],
            args: [
                {
                    id: "name",
                    type: "string"
                }
            ],
        }, false, // available per DM
        true, // cronable
        0 // everyone permission
        );
    }
    desc() {
        return L.get("DESC_WHOIS");
    }
    checkArgs(args) {
        return !args || !args.name || args.name.length < 3 ? L.get("HELPTEXT_WHOIS") : undefined;
    }
    command(message, responsible, guild, args) {
        const name = args.name.toLowerCase();
        const res = this.client.db.whois(name, message.guild.members.filter(m => m.displayName.toLowerCase().search(name) > -1)
            .map(m => m.user));
        if (res.length === 0) {
            this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        }
        else {
            this.reply(message, responsible, L.get("WHOIS_RESULTS"));
            res.forEach(r => this.reply(message, responsible, "<@{0}> | `{1}`".formatUnicorn(r.discord_user, r.account_name)));
        }
    }
}
exports.WhoisCommand = WhoisCommand;
module.exports = WhoisCommand;
