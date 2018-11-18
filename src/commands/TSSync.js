const { Command } = require("discord-akairo");
const winston = require('winston');
const TeamSpeak = require('node-teamspeak-api');
const DB = require.main.require("./src/DB.js");
const Util = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");

class TSSyncCommand extends Command {
    constructor() {
        super("tssync", {
            aliases: ["tssync"],
            userPermissions: ['ADMINISTRATOR']
        });
    }

    exec(message) {

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