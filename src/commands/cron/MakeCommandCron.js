const { Command } = require("discord-akairo");
const winston = require('winston');
const DB = require("../../DB.js");
const Util = require("../../Util.js");
const Const = require("../../Const.js");
const L = require("../../Locale.js");
const config = require("../../../config.json");

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
            return message.author.send(L.get("NOT_AVAILABLE_AS_DM"));
        }

        const schedule = args.schedule;
        const cmd = args.cmd;
        const cmdargs = args.args;

        let mod = this.client.commandHandler.modules[cmd] || Array.from(this.client.commandHandler.modules.values()).filter(m => m.aliases.includes(cmd));

        if(mod.length !== 1) {
            return message.util.send(L.get("NO_SUCH_COMMAND").formatUnicorn(cmd));
        }
        mod = mod[0].id;

        if(mod === this.id) {
            return message.util.send(L.get("CIRCULAR_CRONS"));
        }

        let job = Util.scheduleCronjob(this.client, schedule, message.guild, mod, cmdargs);
        if(!job) {
            return message.util.send(L.get("CRONJOB_NOT_STORED"));
        } else {
            let cid = DB.storeCronjob(schedule, mod, JSON.stringify(cmdargs), message.member.user.id, message.guild.id);
            Util.cronJobs[cid] = job;
            return message.util.send(L.get("CRONJOB_STORED").formatUnicorn(cid));
        }
    }
}

module.exports = MakeSayCron;