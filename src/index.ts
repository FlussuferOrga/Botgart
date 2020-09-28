import * as CommandLineArgs from "command-line-args";
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import { Database } from "./DB";
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
  log("crit", `Unhandled Rejection at: Promise ${JSON.stringify(p)}, reason: ${JSON.stringify(reason)}`);
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
        if(p === undefined) {
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
    process.on('SIGINT', function () {
        log("info", "Shutting down...");

        webServer.close();
        log("info", "Bye");
        process.exit(0);
    });

    log("info", "Starting up...");
    client.login(config.get().token).then(() => {
        log("info", "Started up...");

        log("info", "Starting WebServer...");
        webServer.start();
    }).catch(reason => {
        log("error", `Error starting up Bot: ${reason}`);
        process.exit(1);
    });
}