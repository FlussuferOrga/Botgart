import { BitFieldResolvable, Intents, IntentsString } from "discord.js";
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

    const intents: BitFieldResolvable<IntentsString, number> = [
       "GUILDS",
       "GUILD_MEMBERS",
       "GUILD_EMOJIS_AND_STICKERS",
       "GUILD_INTEGRATIONS",
       "GUILD_WEBHOOKS",
       "GUILD_MESSAGES",
       "GUILD_MESSAGE_REACTIONS",
       "GUILD_MESSAGE_TYPING",
       "DIRECT_MESSAGES",
       "DIRECT_MESSAGE_REACTIONS",
       "DIRECT_MESSAGE_TYPING"
    ]; // privileged intents, require checkbox in discord bot settings

    L.setLanguages(config.get("locales"));
    const client = new BotgartClient(
        { ownerID: config.get("owner_ids") },
        { intents: intents },
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
        });
    // .catch(reason => {
    //     LOG.error(`Error starting up bot: ${reason}`);
    //     process.exit(1);
    // });
}