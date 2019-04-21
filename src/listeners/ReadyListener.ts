import { Listener } from "discord-akairo";
import { log } from "../Util";
import { BotgartClient } from "../BotgartClient";
import { MakeCron } from "../commands/cron/MakeCron";

export class ReadyListener extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            eventName: "ready"
        });
    }

    exec() {
        log("info", "ReadyListener.js", "Bot started!");
        let cl: BotgartClient = <BotgartClient>this.client;
        cl.db.initSchema();
        log("info", "ReadyListener.js", "Database initialised.");
        log("info", "ReadyListener.js", "Rescheduling cronjobs from database.");
        (<MakeCron>cl.commandHandler.modules.get("makecron")).rescheduleCronjobs();
        let help = this.client.commandHandler.modules.get("help").id;
        cl.user.setActivity("{0}{1} für Hilfe".formatUnicorn(cl.akairoOptions.prefix, help));
    }
}