import {GatewayIntentBits, Partials} from "discord.js";
import {BotgartClient} from "./BotgartClient";
import {getConfig} from "./config/Config";
import * as L from "./Locale";
import {logger} from "./util/Logging";
import {WebServer} from "./WebServer";
import {MikroORM} from "@mikro-orm/core";
import {BetterSqliteDriver} from "@mikro-orm/better-sqlite";

const LOG = logger();

export async function runApp(orm: MikroORM<BetterSqliteDriver>) {
    const config = getConfig();

    const intents: GatewayIntentBits[] = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
    ]; // privileged intents, require checkbox in discord bot settings

    L.setLanguages(config.get("locales"));
    const client = new BotgartClient(
        {ownerID: config.get("owner_ids")},
        {
            intents: intents,
            partials: [
                Partials.Channel, // Fix for DMs https://github.com/discordjs/discord.js/issues/5516
            ],
        },
        orm
    );

    const webServer = new WebServer();
    // shutdown listener
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal: NodeJS.Signals) =>
        process.on(signal, () => {
            LOG.info("Shutting down...");
            client.prepareShutdown().then(async () => {
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
    client.login(config.get().token).then(async () => {
        LOG.info("Started up Discord client.");

        LOG.info("Starting web server...");
        await webServer.start();
        LOG.info("Started web server.");
    });
}
