const { Listener } = require("discord-akairo");
const Util = require.main.require("./src/Util.js");
class ReadyListener extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        Util.log("info", "ReadyListener.js", "Bot started!");
        this.client.db.initSchema();
        Util.log("info", "ReadyListener.js", "Database initialised.");
        Util.log("info", "ReadyListener.js", "Rescheduling cronjobs from database.");
        this.client.cronjobs = {};
        this.client.commandHandler.modules.get("makecron").rescheduleCronjobs();
        let help = this.client.commandHandler.modules.get("help").id;
        this.client.user.setActivity("{0}{1} für Hilfe".formatUnicorn(this.client.options.prefix, help));
    }
}
module.exports = ReadyListener;
