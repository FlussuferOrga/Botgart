const { Command } = require("discord-akairo");
const winston = require('winston');
const Util = require.main.require("./src/Util.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");

class DeleteCronCommand extends Command {
    constructor() {
        super("deletecron", {
            aliases: ["deletecron","rmcron","delcron"],
            args: [
                {
                    id: "id",
                    type: "int",
                    default: ""
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        });
    }

    exec(message, args) {
        if(!message.member) {
            return message.util.send(L.get("NOT_AVAILABLE_AS_DM"));
        }

        if(!args.id) {
            return message.util.send(L.get("HELPTEXT_DEL_CRON"));
        }

        let cid = args.id;
        let deleted = Util.deleteCronjob(cid);
        let mes = deleted ? L.get("CRONJOB_DELETED") : L.get("CRONJOB_NOT_DELETED");
        return message.util.send(mes);
    }
}

module.exports = DeleteCronCommand;