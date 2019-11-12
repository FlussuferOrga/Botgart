import { Listener } from "discord-akairo";
import { log, resolveWvWObjective, resolveWvWMap, resolveMatchColour } from "../Util";
import { BotgartClient } from "../BotgartClient";
import { MakeCronCommand } from "../commands/cron/MakeCron";
import { get } from "../Locale";

export class Startup extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }

    exec() {
        log("info", "Startup.js", "Bot started!");
        let cl: BotgartClient = <BotgartClient>this.client;
        cl.db.initSchema();
        log("info", "Startup.js", "Database initialised.");
        log("info", "Startup.js", "Rescheduling cronjobs from database.");
        (<MakeCronCommand>cl.commandHandler.modules.get("makecron")).rescheduleCronjobs();
        let help = this.client.commandHandler.modules.get("help").id;
        cl.user.setActivity("{0}{1} für Hilfe".formatUnicorn(cl.akairoOptions.prefix, help));       
    }
}

module.exports = Startup;