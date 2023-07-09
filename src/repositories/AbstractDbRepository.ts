import { MikroORM } from "@mikro-orm/core";
import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";

export abstract class AbstractDbRepository {
    protected orm: MikroORM<BetterSqliteDriver>;

    public constructor(orm: MikroORM<BetterSqliteDriver>) {
        this.orm = orm;
    }
}
