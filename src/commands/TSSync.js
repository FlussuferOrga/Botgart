const { Command } = require("discord-akairo");
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");
var TeamSpeak = require('node-teamspeak-api');

class TSSyncCommand extends Command {
    constructor() {
        super("tssync", {
            aliases: ["tssync"],
            args: [
                {
                    id: "key",
                    type: "string",
                    default: ""
                }
            ]
        });
    }

    exec(message, args) {

    var tsClient = new TeamSpeak(config.ts.ip, config.ts.port);
    var options = ['away', 'times']; // or for only one options = 'away'
 
    tsClient.send('clientlist', options, function(err, resp, req) {
        console.log(resp.data);
    });
    //Adding params
    var params = {
        client_login_name: config.ts.user,
        client_login_password: config.ts.password
    };
     
    tsClient.send('login', params, function(err, resp, req) {
        console.log(resp.data);
    });

    return message.util.send(L.get("DONE"));
    }
}

module.exports = TSSyncCommand;