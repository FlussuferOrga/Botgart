import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Fishing System
 */
export class Patch12 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.columnExists("registrations", "current_world_id");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare("ALTER TABLE registrations ADD COLUMN current_world_id INTEGER").run();
        this.dbcommit();
        this.connection.prepare("VACUUM;").run();
    }
}
