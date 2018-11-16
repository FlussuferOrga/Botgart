const { Command } = require("discord-akairo");
const winston = require('winston');
const DB = require("../DB.js");
const Util = require("../Util.js");
const Const = require("../Const.js");
const L = require("../Locale.js");
const config = require("../../config.json");

class MakeSayCron extends Command {
    constructor() {
        super("makecmdcron", {
            aliases: ["makecommandcron", "makecmdcron","mkcmdcron"],
            split: "quoted",
            args: [
                {
                    id: "schedule",
                    type: "string",
                    default: ""
                },
                {
                    id: "cmd",
                    type: "string"
                },
                {
                    id: "args",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        });
    }

    exec(message, args) {
        if(!message.member) {
            return message.member.send(L.get("NOT_AVAILABLE_AS_DM"));
        }

        let schedule = args.schedule;
        let cmd = args.cmd;
        let cmdargs = args.args;

        // TODO: lookup commandname from alias
        let job = Util.scheduleCronjob(this.client, args.schedule, message.guild, cmd, cmdargs);
        if(!job) {
            return message.member.send(L.get("CRONJOB_NOT_STORED"));
        } else {
            let cid = DB.storeCronjob(args.schedule, cmd, JSON.stringify(cmdargs), message.member.user.id, message.guild.id);
            Util.cronJobs[cid] = job;
            return message.member.send(L.get("CRONJOB_STORED") + cid);
        }
    }
}

module.exports = MakeSayCron;