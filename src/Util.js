var config = require("../config.json");
const winston = require('winston');
var schedule = require('node-schedule');
var gw2 = require("@cthos/gw2-api");
var api = new gw2.gw2();
api.setStorage(new gw2.memStore());

exports.validateWorld = function(apikey) {
    api.setAPIKey(apikey);
    return api.getAccount().then(
       res => new Promise((resolve, reject) => resolve(res.world === config.world_id)),
       res => new Promise((resolve, reject) => resolve(false))
    );  
}

exports.getAccountGUID = function(apikey) {
    api.setAPIKey(apikey);
    return api.getAccount().then(
        res => new Promise((resolve, reject) => resolve(res.id)),
        res => new Promise((resolve, reject) => resolve(false))
    );
}

exports.scheduleCronjob = function(client, time, guild, command, args) {
    let job = null;
    switch(command) {
        case "say":
            winston.log("info", "Scheduling Say in " + guild + "#" + args.channel.name + " to " + time + ".");
            job = schedule.scheduleJob(time, () => {
                let g = client.guilds.find(g => g.id === guild);
                if(!g) {
                    winston.log("error", "I am not a member of guild " + guild + ". Canceling Say cronjob.");
                    job.cancel();
                    return;
                } else {
                    let c = g.channels.find(c => c.id === args.channel);
                    if(!c) {
                        winston.log("error", "Can not find a channel " + args.channel.name + ". Canceling Say cronjob.");
                        job.cancel();
                        return;
                    } else {
                        c.send(args.text);
                        winston.log("info", "Executed Say.");
                    }
                }
            })
        break;

        default:
        break;
    }
    return job;
}

// taken from https://stackoverflow.com/a/18234317
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};