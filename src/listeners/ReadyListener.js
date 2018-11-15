const DB = require("../DB.js");

const { Listener } = require("discord-akairo");

class ReadyListener extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }

    exec() {
        console.log("Bot started!");
        DB.initSchema();
        console.log("Database initialised.");
    }
}

module.exports = ReadyListener;