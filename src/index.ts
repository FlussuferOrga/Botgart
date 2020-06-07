import * as CommandLineArgs from "command-line-args";
import { BotgartClient } from "./BotgartClient";
import { configuration } from "./config/Config";
import * as db from "./DB"
import { DatabasePatcher } from "./patches/DatabasePatcher";
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

// this is an in-order list of all patches

const database = db.initialize();

if (args.patchall || args.patch) {
    let patcher = new DatabasePatcher(database);
    if (args.patchall) {
        // node built/index.js --patchall
        patcher.applyPatches(allPatches, args.revert === true).then(_ => process.exit(0));
    } else if (args.patch) {
        // node built/index.js --patch=PatchX
        // node built/index.js --patch=PatchX --revert
        patcher.applyPatch(getPatch(args.patch), args.revert === true).then(_ => process.exit(0));
    }
} else {
    log("info", "Starting Botgart...")

    const client = new BotgartClient({ownerID: configuration.get("owner_ids")}, {}, database);
    const webServer = new WebServer();

    //shutdown listener
    process.on('SIGINT', function () {
        log("info", "Shutting down...");

        webServer.close()
        log("info", "Bye");
        process.exit(0);
    });

    log("info", "Starting up...");
    client.login(configuration.get().token).then(() => {
        log("info", "Started up...");

        log("info", "Starting WebServer...")
        webServer.start()
    }).catch(reason => {
        log("error", `Error starting up Bot: ${reason}`);
        process.exit(1);
    });
}