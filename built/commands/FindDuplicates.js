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
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
class FindDuplicatesCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("findduplicates", {
            aliases: ["findduplicates", "finddupes"],
            userPermissions: ['ADMINISTRATOR']
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_FIND_DUPES");
    }
    command(message, responsible, guild, args) {
        let cl = this.client;
        cl.db.findDuplicateRegistrations().forEach(d => {
            // unknown users are already filtered out. Maybe we want to change that and notify the caller
            let users = d.users.split(",").map(u => guild.members.get(u)).filter(u => u);
            responsible.send("{0}: {1}".formatUnicorn(d.gw2account, users.join(", ")));
        });
        Util_1.log("info", "FindDuplicates.js", "Finding duplicates complete.");
    }
    postExecHook(message, args, result) {
        return message.util.send(L.get("FIND_DUPES_COMPLETE"));
    }
}
exports.FindDuplicatesCommand = FindDuplicatesCommand;
