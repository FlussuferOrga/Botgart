import { Listener } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { logger } from "../util/Logging";
import { UseRequestContext } from "@mikro-orm/core";

const LOG = logger();

export class Startup extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            event: "ready",
        });
    }

    @UseRequestContext((type: Listener) => (type.client as BotgartClient).orm)
    exec() {
        LOG.info("Bot started!");
        const client: BotgartClient = this.client as BotgartClient;

        LOG.info("Rescheduling cronjobs from database.");
        client.cronJobService.rescheduleCronJobs();

        const help = client.commandHandler.modules.get("help")?.id;
        client.user?.setActivity("{0}{1} für Hilfe".formatUnicorn(client.commandHandler.prefix, help));
    }
}

module.exports = Startup;
