const { Command } = require("discord-akairo");
const winston = require('winston');
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");

class ListCronsCommand extends Command {
    constructor() {
        super("listcrons", {
            aliases: ["listcrons","lscrons"],
            split: "quoted",
            args: [
                {
                    id: "id",
                    type: "int",
                    default: ""
                }
            ]
        });
    }

    exec(message, args) {
        if(!message.member) {
            return message.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        return;
    }
}

module.exports = ListCronsCommand;