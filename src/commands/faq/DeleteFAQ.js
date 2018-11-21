const { Command } = require("discord-akairo");
const winston = require("winston");
const { assertType } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");

/**
Testcases:
- use proper key for existing faq with multiple keys -> key is properly removed, but faq still available
- use proper key for existing faq with only one key left -> key is removed as well as whole faq
- use key that doesn't exist -> user receives corresponding feedback
- cron: all of the above
*/

class DeleteFAQCommand extends BotgartCommand {
    constructor() {
        super("delfaq", {
            aliases: ["deletefaq","rmfaq","delfaq","deletertfm","rmrtfm","delrtfm"],
            split: "quoted",
            args: [
                {
                    id: "key",
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
        return L.get("DESC_DEL_FAQ");
    }

    checkArgs(args) {
        return !args || !args.keys || !args.text ? message.util.send(L.get("HELPTEXT_DEL_FAQ")) : undefined;
    }

    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        assertType(args.keys, "Array");
        assertType(args.text, "String");

        let deleted = this.client.db.deleteFAQ(args.text);
        let message = deleted ? L.get("FAQ_DELETED") : L.get("FAQ_NOT_DELETED");
        if(message) {
            message.util.send(message);
        } else {
            responsible.send(messag);
        }
    }
}

module.exports = DeleteFAQCommand;