const { Command } = require("discord-akairo");
const { assertType, log } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");
const TEASER_LENGTH = 30;
/**
Testcases:
- list faqs -> bot lists all available faqs
*/
class ListFAQsCommand extends BotgartCommand {
    constructor() {
        super("listfaqs", {
            aliases: ["listfaqs", "lsfaqs", "lsrtfms"]
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_LIST_FAQS");
    }
    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        if (!responsible) {
            log("error", "ListFAQs.js", "Can not execute lsfaqs without member to reply to. Canceling.");
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
module.exports = ListFAQsCommand;
