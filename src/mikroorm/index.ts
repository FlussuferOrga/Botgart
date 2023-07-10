import { BetterSqliteDriver, MikroORM } from "@mikro-orm/better-sqlite";
import mikroOrmConfig from "./config";
import { logger } from "../util/Logging";

const LOG = logger();

export async function setupPersistence() {
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
        throw Error("Database Migration is required");
    }

    async function optimize() {
        const knex = orm.em.getKnex();
        await knex.raw("PRAGMA analysis_limit=400");
        await knex.raw("PRAGMA optimize;");
        LOG.debug("Done optimizing database");
    }

    LOG.info(`Scheduling database optimization every 60 minutes.`);
    setInterval(optimize, 6 * 60 * 60 * 1000);
    return orm;
}
