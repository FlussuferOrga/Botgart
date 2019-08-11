"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const Const = __importStar(require("../Const"));
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class WhoisCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("whois", {
            aliases: ["whois"],
        }, true, // available per DM
        true, // cronable
        0 // everyone permission
        );
    }
    desc() {
        return L.get("DESC_WHOIS");
    }
    command(message, responsible, guild, args) {
        // if this command is issued on a server, only the commands the user can execute
        // are listed.
        // Issueing this command through DMs give the full list. This is not a security issue,
        // since the restricted listing is just a convenience for users to present them with a
        // more compact help text.
        let member = guild ? guild.members.find(m => m.id == responsible.id) : undefined;
        let checkPermissions = member ? member.permissions.has.bind(member.permissions) : () => true;
        let descs = "**Verfügbare Befehle:**\n\n"
            .concat(Array.from(this.client.commandHandler.modules.values())
            .filter(m => !m.userPermissions || checkPermissions(m.userPermissions))
            .map(m => m)
            .map(m => m.desc
            ? "**`{0}`** (bzw. {1}): {2}".formatUnicorn(m.id, m.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", "), m.desc())
            : m.id).join("\n\n"));
        // when having too many active commands, we could very well reach
        // the maximum message length from all the descriptions.
        // As a fallback, we break the message up to contain one command each.
        let ms = descs.length < Const.MAX_MESSAGE_LENGTH ? [descs] : descs.split("\n\n");
        ms.forEach(m => {
            this.reply(message, responsible, m).then(() => { }, (err) => Util_1.log("error", "Help.js", err.message) //winston.log("error", "Help.js: help-string exceeds maximum length even after splitting on command-to-command-level. One or more desc-strings seem to be too long.")
            );
        });
        if (ms.length > 1) {
            Util_1.log("warning", "Help.js", "help-string exceeds maximum message length. This case is covered, but you should look into cutting down the desc-strings for some commands.");
        }
    }
}
exports.WhoisCommand = WhoisCommand;
module.exports = WhoisCommand;
