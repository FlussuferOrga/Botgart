const DB = require("../DB.js");
const winston = require('winston');
const { Listener } = require("discord-akairo");
const Util = require("../Util.js");

class ReadyListener extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }

    exec() {
        winston.log("info", "Bot started!");
        DB.initSchema();
        winston.log("info", "Database initialised.");
        winston.log("info", "Rescheduling cronjobs from database.");
        Util.rescheduleCronjobs(this.client);
        //DB.dummy();

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

module.exports = ReadyListener;