// show .ts files in stacktraces if sourcemaps are present
import "source-map-support/register";
import * as CommandLineArgs from "command-line-args";
import {runApp} from "./app";

import "./util/string.extensions";
import {setupPersistence} from "./mikroorm";
import {logger} from "./util/Logging";

const LOG = logger();

const args = CommandLineArgs.default([]);

async function run(args) {
    const orm = await setupPersistence();
    LOG.info("Starting Botgart...");

    await runApp(orm);
}

// noinspection JSIgnoredPromiseFromCall
run(args);
