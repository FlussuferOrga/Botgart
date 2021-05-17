import * as CommandLineArgs from "command-line-args";

import { Intents } from "discord.js";
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import { Database } from "./database/Database";
import { DatabasePatcher } from "./database/patches/DatabasePatcher";
import { DBPatch } from "./database/patches/DBPatch";
import { allPatches, getPatch } from "./database/patches/PatchRegistry";
import * as L from "./Locale";
import { logger, registerUnhandledRejection } from "./util/Logging";
import "./util/string.extensions";
import { WebServer } from "./WebServer";

const LOG = logger();
registerUnhandledRejection();

// bit weird but works only this way...
const args = CommandLineArgs.default([
    { name: "patch", type: String, multiple: true },
    { name: "patchall", type: Boolean },
    { name: "revert", type: Boolean },
]);

const config = getConfig();

const database = Database.getInstance(config.get("db_location"));

if (args.patchall || args.patch) {
    const patcher = new DatabasePatcher(database);
    if (args.patchall) {
        // node built/index.js --patchall
        patcher.applyPatches(allPatches, args.revert === true).then(_ => process.exit(0));
    } else if (args.patch) {
        // node built/index.js --patch=PatchX
        // node built/index.js --patch=PatchX --revert
        const p: typeof DBPatch | undefined = getPatch(args.patch); // those are classes, not instances, so that they are only instantiated with the DB if needed
        if (p === undefined) {
            LOG.warn(`No patch ${args.patch} could be found to apply/revert.`);
        } else {
            patcher.applyPatch(p as (typeof DBPatch), args.revert === true).then(_ => process.exit(0));
        }
    }
} else {
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
                .then(() => {
                    client.destroy();
                    webServer.close();
                    LOG.info("Bye");
                    process.exit(0);
                });
        })
    );

    LOG.info("Starting up...");
    client.login(config.get().token).then(() => {
        LOG.info("Started up...");

        LOG.info("Starting WebServer...");
        webServer.start();
    }).catch(reason => {
        LOG.error(`Error starting up Bot: ${reason}`);
        process.exit(1);
    });
}