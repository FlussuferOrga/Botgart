import { Listener } from "discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { MakeCron } from "../commands/cron/MakeCron";
import { log } from "../Util";

export class Startup extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            event: "ready"
        });
    }

    exec() {
        log("info", "Bot started!");
        let cl: BotgartClient = <BotgartClient>this.client;
        log("info", "Rescheduling cronjobs from database.");
        (<MakeCron>cl.commandHandler.modules.get("makecron")).rescheduleCronjobs();
        let help = cl.commandHandler.modules.get("help").id;
        cl.user.setActivity("{0}{1} für Hilfe".formatUnicorn(cl.commandHandler.prefix, help));       
    }
}

module.exports = Startup;