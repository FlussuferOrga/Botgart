import { Listener } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient.js";
import { logger } from "../util/Logging.js";
import { CreateRequestContext } from "@mikro-orm/core";

const LOG = logger();

export default class Startup extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            event: "ready",
        });
    }

    @CreateRequestContext((type: Listener) => (type.client as BotgartClient).orm)
    exec() {
        LOG.info("Bot started!");
        const client: BotgartClient = this.client as BotgartClient;

        LOG.info("Rescheduling cronjobs from database.");
        client.cronJobService.rescheduleCronJobs();

        const help = client.commandHandler.modules.get("help")?.id;
        client.user?.setActivity("{0}{1} für Hilfe".formatUnicorn(client.commandHandler.prefix, help));
    }
}
