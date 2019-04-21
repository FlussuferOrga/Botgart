"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
class ReadyListener extends discord_akairo_1.Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        Util.log("info", "ReadyListener.js", "Bot started!");
        let cl = this.client;
        cl.db.initSchema();
        Util.log("info", "ReadyListener.js", "Database initialised.");
        Util.log("info", "ReadyListener.js", "Rescheduling cronjobs from database.");
        cl.commandHandler.modules.get("makecron").rescheduleCronjobs();
        let help = this.client.commandHandler.modules.get("help").id;
        cl.user.setActivity("{0}{1} für Hilfe".formatUnicorn(this.client.akairoOptions.prefix, help));
    }
}
module.exports = ReadyListener;
