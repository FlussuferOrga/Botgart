import * as L from "../Locale";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import * as Util from "../Util";

class SetTS3ResetRosterCommand extends BotgartCommand {
    constructor() {
        super("setts3resetroster", {
                aliases: ["setts3resetroster"],
                userPermissions: ['ADMINISTRATOR']
            },
            false, // available per DM
            true // cronable
        );
    }

    desc() {
        return L.get("DESC_SET_TS3_RESET_ROSTER");
    }

    command(message, responsible, guild, args) {
        console.log(this.getBotgartClient().getTS3Connection())
        const week = Util.getNumberOfWeek();
        console.log(this.getBotgartClient().getRoster(guild, week, 2019));
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

module.exports = SetTS3ResetRosterCommand;