"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
const Util_1 = require("../Util");
const Locale_1 = require("../Locale");
class ReadyListener extends discord_akairo_1.Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        Util_1.log("info", "ReadyListener.js", "Bot started!");
        let cl = this.client;
        cl.db.initSchema();
        Util_1.log("info", "ReadyListener.js", "Database initialised.");
        Util_1.log("info", "ReadyListener.js", "Rescheduling cronjobs from database.");
        cl.commandHandler.modules.get("makecron").rescheduleCronjobs();
        let help = this.client.commandHandler.modules.get("help").id;
        cl.user.setActivity("{0}{1} für Hilfe".formatUnicorn(cl.akairoOptions.prefix, help));
        console.log(Locale_1.get("TEST"));
    }
}
exports.ReadyListener = ReadyListener;
module.exports = ReadyListener;
