import {Database} from "../Database";
import {DBPatch} from "./DBPatch";

/**
 * Fishing System
 */
export class Patch14 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return !this.columnExists("registrations", "registration_role");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare("ALTER TABLE registrations DROP COLUMN registration_role").run();
        this.dbcommit();
        this.connection.prepare("VACUUM;").run();
    }
}
