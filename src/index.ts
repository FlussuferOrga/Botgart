import * as CommandLineArgs from "command-line-args";

import "source-map-support/register";
import { runApp } from "./app";
import { getConfig } from "./config/Config"; // show .ts files in stacktraces if sourcemaps are present
import { Database } from "./database/Database";
import { DatabasePatcher } from "./database/patches/DatabasePatcher";
import { DBPatch } from "./database/patches/DBPatch";
import { allPatches, getPatch } from "./database/patches/PatchRegistry";
import { logger } from "./util/Logging";
import "./util/string.extensions";
import {getAccountInfo} from "./Gw2ApiUtils";

const LOG = logger();

const args = CommandLineArgs.default([
    { name: "verbose", alias: "v", type: Boolean },
    { name: "patch", type: String, multiple: true },
    { name: "patchall", type: String },
]);

async function run(args) {
    const config = getConfig();
    const database = Database.getInstance(config.get("db_location"));

    if ("patchall" in args) {
        LOG.info("Patching Database");
        // node built/index.js --patchall
        await new DatabasePatcher(database).applyPatches(allPatches);
        if (args.patchall !== "run") {
            LOG.info("Patching Database done. Shutting down. (Run with --patchall=run to prevent this)");
            return;
        }
        LOG.info("Patching Database done.");
    } else if ("patch" in args) {
        // node built/index.js --patch=PatchX
        // node built/index.js --patch=PatchX --revert
        LOG.info(`Patching Database with Patches [${args.patch.join(",")}]`);
        const p: typeof DBPatch | undefined = getPatch(args.patch); // those are classes, not instances, so that they are only instantiated with the DB if needed
        if (p === undefined) {
            LOG.warn(`No patch ${args.patch} could be found to apply.`);
        } else {
            await new DatabasePatcher(database).applyPatch(p as typeof DBPatch);
        }
    }
    await runApp(database);
}

run(args);
