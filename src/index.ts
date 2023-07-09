// show .ts files in stacktraces if sourcemaps are present
import "source-map-support/register";
import * as CommandLineArgs from "command-line-args";
import { runApp } from "./app";
import { logger } from "./util/Logging";
import mikroOrmConfig from "./mikroorm/config";

import "./util/string.extensions";

import { BetterSqliteDriver, MikroORM } from "@mikro-orm/better-sqlite";

const LOG = logger();

const args = CommandLineArgs.default([]);

async function run(args) {
    const orm = await MikroORM.init<BetterSqliteDriver>(mikroOrmConfig, false);
    LOG.info("Connecting to DB");
    await orm.connect();

    LOG.debug("Create Schema:\n\n " + (await orm.getSchemaGenerator().getCreateSchemaSQL()) + "\n\n");

    const migrator = orm.getMigrator();
    await migrator.up();

    const updateMigration = await orm.getSchemaGenerator().getUpdateSchemaSQL();
    if (updateMigration) {
        LOG.warn("Missing Migration Steps:" + updateMigration);
        await orm.close();
        return;
    }

    async function optimize() {
        const knex = orm.em.getKnex();
        await knex.raw("PRAGMA analysis_limit=400");
        await knex.raw("PRAGMA optimize;");
        LOG.debug("Done optimizing database");
    }

    LOG.info(`Scheduling database optimization every 60 minutes.`);
    setInterval(optimize, 6 * 60 * 60 * 1000);

    LOG.info("Patching Database done.");
    await runApp(orm);
}

run(args);
