import { Database } from "../database/DB";

export abstract class AbstractDbRepository {
    private db: Database;

    public constructor(db: Database) {
        this.db = db;
    }

    protected execute<T>(f: (sqlite3) => T): T | undefined {
        return this.db.execute(f)
    }
}