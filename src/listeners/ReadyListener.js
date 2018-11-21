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
        this.client.cronjobs = {};
        this.client.commandHandler.modules.get("makecron").rescheduleCronjobs();
    }
}

module.exports = ReadyListener;