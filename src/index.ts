// show .ts files in stacktraces if sourcemaps are present
import * as CommandLineArgs from "command-line-args";
import { runApp } from "./app.js";

import "./util/string.extensions.js";
import { setupPersistence } from "./mikroorm/index.js";
import { logger } from "./util/Logging.js";

const LOG = logger();

const args = CommandLineArgs.default([]);

async function run(args) {
    const orm = await setupPersistence();
    LOG.info("Starting Botgart...");

    await runApp(orm);
}

// noinspection JSIgnoredPromiseFromCall
run(args);
