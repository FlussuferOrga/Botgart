import * as CommandLineArgs from "command-line-args";
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import { Database } from "./database/DB";
import { DatabasePatcher } from "./patches/DatabasePatcher";
import { DBPatch } from "./patches/DBPatch";
import { allPatches, getPatch } from "./patches/PatchRegistry";
import { log } from "./Util";
import { WebServer } from "./WebServer";

// bit weird but works only this way...
const args = CommandLineArgs.default([
    {name: "verbose", alias: "v", type: Boolean},
    {name: "patch", type: String, multiple: true},
    {name: "patchall", type: Boolean},
    {name: "revert", type: Boolean}
]);

process.on("unhandledRejection", (reason, p) => {
    log("crit", `Unhandled Rejection!`);
    // JSON.stringify does not handle errors and especially not Promises:
    // https://levelup.gitconnected.com/beware-of-using-json-stringify-for-logging-933f18626d51
    // The suggested solution there produces ugly output, so I am falling back to this to find proper errors during rejections
    console.error("Promise", p);
    console.error("Reason", reason);
});

// this is an in-order list of all patches

const database = Database.getInstance("./db/database.db");

if (args.patchall || args.patch) {
    let patcher = new DatabasePatcher(database);
    if (args.patchall) {
        // node built/index.js --patchall
        patcher.applyPatches(allPatches, args.revert === true).then(_ => process.exit(0));
    } else if (args.patch) {
        // node built/index.js --patch=PatchX
        // node built/index.js --patch=PatchX --revert
        const p: typeof DBPatch | undefined = getPatch(args.patch); // those are classes, not instances, so that they are only instantiated with the DB if needed
        if (p === undefined) {
            log("warning", `No patch ${args.patch} could be found to apply/revert.`);
        } else {
            patcher.applyPatch(<typeof DBPatch>p, args.revert === true).then(_ => process.exit(0));
        }
    }
} else {
    const config = getConfig();

    log("info", "Starting Botgart...");

    const client = new BotgartClient({ownerID: config.get("owner_ids")}, {}, database);
    const webServer = new WebServer();

    //shutdown listener
    ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal: NodeJS.Signals) =>
        process.on(signal, () => {
            log("info", "Shutting down...");
            client.destroy();
            webServer.close();
            database.close();
            log("info", "Bye");
            process.exit(0);
        })
    );

    log("info", "Starting up...");
    client.login(config.get().token).then(() => {
        log("info", "Started up...");

        log("info", "Starting WebServer...");
        webServer.start();
    }).catch(reason => {
        log("error", `Error starting up Bot: ${reason}`);
        database.close();
        process.exit(1);
    });
}