const { Command } = require("discord-akairo");
const winston = require('winston');
const DB = require("../../DB.js");
const Util = require("../../Util.js");
const Const = require("../../Const.js");
const L = require("../../Locale.js");
const config = require("../../../config.json");

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
            userPermissions: ["ADMINISTRATOR"]
        });
    }

    exec(message, args) {
        if(!message.member) {
            return message.util.send(L.get("NOT_AVAILABLE_AS_DM"));
        }

        if(!args.channel || !args.text) {
            return message.util.send(L.get("HELPTEXT_SAY_CRON"));
        }

        let cmdargs = {channel: args.channel.id, text: args.text};
        let job = Util.scheduleCronjob(this.client, args.schedule, message.guild, "say", cmdargs);
        if(!job) {
            return message.util.send(L.get("CRONJOB_NOT_STORED"));
        } else {
            let cid = DB.storeCronjob(args.schedule, "say", JSON.stringify(cmdargs), message.member.user.id, message.guild.id);
            Util.cronJobs[cid] = job;
            return message.util.send(L.get("CRONJOB_STORED").formatUnicorn(cid));
        }
    }
}

module.exports = MakeSayCron;