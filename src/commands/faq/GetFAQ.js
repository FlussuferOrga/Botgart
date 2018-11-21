const { Command } = require("discord-akairo");
const winston = require('winston');
const { assertType } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");

/**
Testcases:
- missing key -> feedback to user
- existing key -> bot posts corresponding faq
- non-existing key -> feedback to user
*/

class GetFAQCommand extends BotgartCommand {
    constructor() {
        super("getfaq", {
            aliases: ["getfaq","faq","getrtfm","rtfm"],
            args: [
                {
                    id: "key",
                    type: "string"
                }
            ]
        },
        false,  // available per DM
        true // cronable
        );
    }

    desc() {
        return L.get("DESC_GET_FAQ");
    }

    checkArgs(args) {
        return !args || !args.key ? message.util.send(L.get("HELPTEXT_GET_FAQ")) : undefined;
    }

    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(args.key, "String");

        let faq = this.client.db.getFAQ(args.key);
        let response = faq ? faq.text : L.get("FAQ_NOT_FOUND").formatUnicorn(args.key);

        if(message) {
            message.util.send(response);
        } else {
            responsible.send(response);
        }
    }
}

module.exports = GetFAQCommand;