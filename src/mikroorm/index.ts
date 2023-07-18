import { BetterSqliteDriver, MikroORM } from "@mikro-orm/better-sqlite";
import mikroOrmConfig from "./config.js";
import { logger } from "../util/Logging.js";

const LOG = logger();

export async function setupPersistence() {
    const orm = await MikroORM.init<BetterSqliteDriver>(mikroOrmConfig, false);
    LOG.info("Connecting to DB");
    await orm.connect();

    async function optimize() {
        const knex = orm.em.getKnex();
        // await knex.raw("PRAGMA analysis_limit=400");
        // await knex.raw("PRAGMA optimize;");
        await knex.raw("drop table if exists sqlite_stat1;");
        await knex.raw("drop table if exists sqlite_stat2;");
        await knex.raw("drop table if exists sqlite_stat3;");
        await knex.raw("drop table if exists sqlite_stat4;");
        LOG.debug("Done optimizing database");
    }

    await optimize();

    //LOG.debug("Create Schema:\n\n " + (await orm.getSchemaGenerator().getCreateSchemaSQL()) + "\n\n");

    const migrator = orm.getMigrator();
    await migrator.up();

    const updateMigration = await orm.getSchemaGenerator().getUpdateSchemaSQL();
    if (updateMigration) {
        LOG.warn("Missing Migration Steps:" + updateMigration);
        await orm.close();
        throw Error("Database Migration is required");
    }

    LOG.info(`Scheduling database optimization every 60 minutes.`);
    //setInterval(optimize, 6 * 60 * 60 * 1000);
    return orm;
}
