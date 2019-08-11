"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../../Util");
const Const = __importStar(require("../../Const"));
const L = __importStar(require("../../Locale"));
const BotgartCommand_1 = require("../../BotgartCommand");
const TEASER_LENGTH = 30;
/**
Testcases:
- list faqs -> bot lists all available faqs
*/
class ListFAQsCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("listfaqs", {
            aliases: ["listfaqs", "lsfaqs", "lsrtfms"]
        }, false, // available per DM
        false, // cronable
        1 // everyone permissions
        );
    }
    desc() {
        return L.get("DESC_LIST_FAQS");
    }
    command(message, responsible, guild, args) {
        if (!responsible) {
            Util_1.log("error", "ListFAQs.js", "Can not execute lsfaqs without member to reply to. Canceling.");
            return;
        }
        let format = "{0} | {1}";
        let header = format.formatUnicorn("KEY", "       TEXT      ") + "\n";
        let mes = header;
        this.client.db.getFAQs(guild.id).forEach((faq) => {
            let t = faq.text.length < TEASER_LENGTH ? faq.text : faq.text.substring(0, TEASER_LENGTH - 3) + "...";
            let line = format.formatUnicorn(faq.key, t) + "\n";
            if (mes.length + line.length < Const.MAX_MESSAGE_LENGTH - 10) {
                // leave some space for the backticks and additional linebreaks
                mes += line;
            }
            else {
                // message full -> send it and start a new one
                mes = "```\n" + mes + "\n```";
                responsible.send(mes);
                mes = header + line;
            }
        });
        responsible.send("```\n" + mes + "\n```");
    }
}
exports.ListFAQsCommand = ListFAQsCommand;
module.exports = ListFAQsCommand;
