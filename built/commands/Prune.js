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
const Util = __importStar(require("../Util"));
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class PruneCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("prune", {
            aliases: ["prune"],
            args: [
                {
                    id: "days",
                    type: "integer",
                    default: -1
                },
                {
                    id: "message",
                    type: "string",
                    default: ""
                }
            ]
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_PRUNE");
    }
    checkArgs(args) {
        return !args || args.days === undefined || args.days < 1 || args.days > 30 ? L.get("HELPTEXT_PRUNE") : undefined;
    }
    command(message, responsible, guild, args) {
        return guild.pruneMembers(args.days, false, args.message)
            .then(pruned => {
            let mes = "{0} members have been pruned after being inactive without role for at least {1} days.".formatUnicorn(pruned, args.days);
            Util.log("info", "Prune.js", "{0} members have been pruned after being inactive without role for at least {1} days.".formatUnicorn(pruned, args.days));
            return mes;
        })
            .catch(e => {
            Util.log("error", "Prune.js", e.message);
            return "An error occurred while pruning: {0}".formatUnicorn(e.message);
        });
    }
    postExecHook(message, args, result) {
        return result.then(m => message.util.send(m)).catch(console.error);
    }
}
exports.PruneCommand = PruneCommand;
PruneCommand.LOG_TYPE_AUTH = "auth";
module.exports = PruneCommand;
