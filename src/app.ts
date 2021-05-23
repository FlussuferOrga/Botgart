import { Intents } from "discord.js";
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import { Database } from "./database/Database";
import * as L from "./Locale";
import { logger } from "./util/Logging";
import { WebServer } from "./WebServer";

const LOG = logger();

export async function runApp(database: Database) {
    const config = getConfig();

    LOG.info("Starting Botgart...");

    const intents = new Intents(Intents.NON_PRIVILEGED); // default intents
    intents.add("GUILD_MEMBERS"); // privileged intents, require checkbox in discord bot settings

    L.setLanguages(config.get("locales"));
    const client = new BotgartClient(
        { ownerID: config.get("owner_ids") },
        { ws: { intents: intents } },
        database);

    const webServer = new WebServer();
    // shutdown listener
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal: NodeJS.Signals) =>
        process.on(signal, () => {
            LOG.info("Shutting down...");
            client.prepareShutdown()
                .then(async () => {
                    LOG.info("Shutting down discord client...");
                    client.destroy();
                    LOG.info("Shutting down web server...");
                    await webServer.close();
                    LOG.info("Bye");
                    process.exit(0);
                });
        })
    );

    LOG.info("Starting Discord client...");
    client.login(config.get().token)
        .then(async () => {
            LOG.info("Started up Discord client.");

            LOG.info("Starting web server...");
            await webServer.start();
            LOG.info("Started web server.");

            await database.scheduleOptimize(15);
        });
    // .catch(reason => {
    //     LOG.error(`Error starting up bot: ${reason}`);
    //     process.exit(1);
    // });
}