const { Command } = require("discord-akairo");
const winston = require("winston");
const { assertType } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");

/**
Testcases:
- create faq properly -> faq is now present in db and available for ,faq
- use multiple keys -> faq is present in db unter multiply names
- use already existing keys -> faq is now overridden
- missing parameters -> error
*/

class MakeFAQCommand extends BotgartCommand {
    constructor() {
        super("addfaq", {
            aliases: ["makertfm","makefaq","newrtfm","newfaq","addrtfm","addfaq","mkrtfm","mkfaq"],
            split: "quoted",
            args: [
                {
                    id: "keys",
                    type: es => es ? es.split(";") : []
                },
                {
                    id: "text",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        },
        false,  // available per DM
        true // cronable
        );
    }

    desc() {
        return L.get("DESC_ADD_FAQ");
    }

    checkArgs(args) {
        return !args || !args.keys || !args.text || args.keys.length < 1 ? message.util.send(L.get("HELPTEXT_ADD_FAQ")) : undefined;
    }

    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        assertType(args.keys, "Array");
        assertType(args.text, "String");

        this.client.db.storeFAQ(responsible.id, guild.id, args.keys, args.text);
        if(message) {
            message.util.send(L.get("FAQ_STORED"));
        } else {
            responsible.send(L.get("FAQ_STORED"));
        }
    }
}

module.exports = MakeFAQCommand;