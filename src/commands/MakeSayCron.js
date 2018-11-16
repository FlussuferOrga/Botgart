const { Command } = require("discord-akairo");
const winston = require('winston');
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");

class MakeSayCron extends Command {
    constructor() {
        super("makesaycron", {
            aliases: ["makesaycron","mksaycron"],
            split: "quoted",
            args: [
                {
                    id: "schedule",
                    type: "string",
                    default: ""
                },
                {
                    id: "channel",
                    type: "textChannel"
                },
                {
                    id: "text",
                    type: "string"
                }
            ],
            userPermissions: ['ADMINISTRATOR']
        });
    }

    exec(message, args) {
        if(!message.member) {
            return message.member.send(L.get("NOT_AVAILABLE_AS_DM"));
        }

        let cmdargs = {channel: args.channel.id, text: args.text};
        let job = Util.scheduleCronjob(this.client, args.schedule, message.guild.id, "say", cmdargs);
        if(!job) {
            return message.member.send(L.get("CRONJOB_NOT_STORED"));
        } else {
            let cid = DB.storeCronjob(args.schedule, "say", JSON.stringify(cmdargs), message.member.user.id, message.guild.id);
            return message.member.send(L.get("CRONJOB_STORED") + cid);
        }
    }
}

module.exports = MakeSayCron;