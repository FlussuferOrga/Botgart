const { Command } = require("discord-akairo");
const winston = require('winston');
const Util = require("../Util.js");
const L = require("../Locale.js");
const config = require("../../config.json");

class DeleteCronCommand extends Command {
    constructor() {
        super("deletecrons", {
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
            return message.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        let cid = args.id;
        let deleted = Util.deleteCronjob(cid);
        let mes = deleted ? L.get("CRONJOB_DELETED") : L.get("CRONJOB_NOT_DELETED");
        return message.author.send(mes);
    }
}

module.exports = DeleteCronCommand;