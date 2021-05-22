import * as CommandLineArgs from "command-line-args";

import { Intents } from "discord.js";

import "source-map-support/register"; // show .ts files in stacktraces if sourcemaps are present
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import { Database } from "./database/Database";
import { DatabasePatcher } from "./database/patches/DatabasePatcher";
import { DBPatch } from "./database/patches/DBPatch";
import { allPatches, getPatch } from "./database/patches/PatchRegistry";
import * as L from "./Locale";
import { logger } from "./util/Logging";
import "./util/string.extensions";
import { WebServer } from "./WebServer";

// bit weird but works only this way...
const args = CommandLineArgs.default([
    { name: "verbose", alias: "v", type: Boolean },
    { name: "patch", type: String, multiple: true },
    { name: "patchall", type: Boolean },
    { name: "revert", type: Boolean }
]);

const LOG = logger();

process.on("unhandledRejection", (reason, p) => {
    LOG.error("Unhandled Rejection!");
    // JSON.stringify does not handle errors and especially not Promises:
    // https://levelup.gitconnected.com/beware-of-using-json-stringify-for-logging-933f18626d51
    // The suggested solution there produces ugly output, so I am falling back to this to find proper errors during rejections
    /* eslint-disable no-console */
    console.error("Promise", p);
    console.error("Reason", reason);
    /* eslint-enable no-console */
});

// this is an in-order list of all patches

const database = Database.getInstance("./db/database.db");

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