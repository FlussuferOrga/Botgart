const { Command } = require("discord-akairo");
const { assertType, shallowInspect, log } = require.main.require("./src/Util.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");
/**
Testcases:

*/
class FindDucplicatesCommand extends BotgartCommand {
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
        let that = this;
        this.client.db.findDuplicateRegistrations().forEach(d => {
            // unknown users are already filtered out. Maybe we want to change that and notify the caller
            let users = d.users.split(",").map(u => guild.members.get(u)).filter(u => u);
            responsible.send("{0}: {1}".formatUnicorn(d.gw2account, users.join(", ")));
        });
        log("info", "FindDuplicates.js", "Finding duplicates complete.");
    }
    postExecHook(message, args, result) {
        return message.util.send(L.get("FIND_DUPES_COMPLETE"));
    }
}
module.exports = FindDucplicatesCommand;
