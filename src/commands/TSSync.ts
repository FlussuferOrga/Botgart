const { Command } = require("discord-akairo");
const TeamSpeak = require('node-teamspeak-api');
const Util = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");

class TSSyncCommand extends BotgartCommand {
    constructor() {
        super("tssync", {
                aliases: ["tssync"],
                userPermissions: ['ADMINISTRATOR']
            },
            true, // available per DM
            true // cronable
        );
    }

    desc() {
        return L.get("DESC_TS_SYNC");
    }

    command(message, responsible, guild, args) {
        return;
                /*const config = require("../../config.json");
        var TeamSpeak = require('node-teamspeak-api');
        var tsClient = new TeamSpeak(config.ts.ip, config.ts.port);
        
        var options = ['away', 'times']; // or for only one options = 'away'
     
        tsClient.send('clientlist', options, function(err, resp, req) {
            console.log(err,resp,req);
        });*/
        //Adding params
        /*var params = {
            client_login_name: config.ts.user,
            client_login_password: config.ts.password
        };
         
         
        tsClient.send('use', ["0"], function(err, resp, req) {
            console.log(err,resp,req);
        });

        tsClient.send('login', params, function(err, resp, req) {
            console.log(err,resp,req);
        });*/

        /*var params = {"sid": 1};
        var options = ['away', 'times',"groups"]; // or for only one options = 'away'

        tsClient.api.login({
            client_login_name: config.ts.user,
            client_login_password: config.ts.password
        }, (err, resp, req) => {
            tsClient.api.use({"sid": 1}, (err, resp, req) => {
                tsClient.api.clientlist(options,(err, resp, req) => {
                    console.log(err,resp,req);
                });
            }); 
        });*/
    }
}

module.exports = TSSyncCommand;