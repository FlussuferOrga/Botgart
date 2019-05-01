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
const L = __importStar(require("../../Locale"));
const BotgartCommand_1 = require("../../BotgartCommand");
const Util_1 = require("../../Util");
/**
Testcases:
- missing parameters -> error
- delete valid cron id -> successfully deletes cron from db and unschedules it
- delete invalid cron id -> error
- delete non-numeric cron id -> error
- cron: anything -> error
*/
class DeleteCronCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("deletecron", {
            aliases: ["deletecron", "rmcron"],
            args: [
                {
                    id: "id",
                    type: "integer",
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_DEL_CRON");
    }
    checkArgs(args) {
        return args === undefined || args.id === undefined || args.id < 0 ? L.get("HELPTEXT_DEL_CRON") : undefined;
    }
    command(message, responsible, guild, args) {
        return this.deleteCronjob(args.id);
    }
    exec(message, args) {
        if (!message.member) {
            return message.util.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        let errorMessage = this.checkArgs(args);
        if (errorMessage) {
            return message.util.send(errorMessage);
        }
        let mes = this.command(message, message.author, message.guild, args) ? L.get("CRONJOB_DELETED") : L.get("CRONJOB_NOT_DELETED");
        return message.util.send(mes);
    }
    /**
    * Deletes a scheduled cronjob from DB and/or schedule.
    * @param {int} id - ID of the cronjob to delete
    * @returns {boolean} - whether the cron was deleted from either DB or schedule.
    */
    deleteCronjob(id) {
        let canceled = false;
        let deletedFromDB = false;
        let cl = this.client;
        if (id in cl.cronjobs) {
            cl.cronjobs[id].cancel();
            delete cl.cronjobs[id];
            canceled = true;
            Util_1.log("info", "DeleteCron.js", "Canceled cronjob with ID {0}.".formatUnicorn(id));
        }
        if (cl.db.deleteCronjob(id)) {
            deletedFromDB = true;
            Util_1.log("info", "DeleteCron.js", "Deleted cronjob with ID {0} from DB.".formatUnicorn(id));
        }
        return canceled || deletedFromDB;
    }
}
exports.DeleteCronCommand = DeleteCronCommand;
module.exports = DeleteCronCommand;
