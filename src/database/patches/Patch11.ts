import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Fishing System
 */
export class Patch11 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.indexExists("matchup_objectives", "matchup_objectives_last_flipped_index")
            && this.indexExists("matchup_objectives", "matchup_objectives_oid_sid_mid_index");
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.prepare(
            `CREATE INDEX IF NOT EXISTS matchup_objectives_last_flipped_index
                ON matchup_objectives (last_flipped);`)
            .run();

        this.connection.prepare(
            `CREATE INDEX IF NOT EXISTS matchup_objectives_oid_sid_mid_index
                ON matchup_objectives (objective_id, snapshot_id, matchup_id);`)
            .run();
    }

    public async revert(): Promise<void> {
        this.connection.prepare("DROP INDEX matchup_objectives_last_flipped_index;").run();
        this.connection.prepare("DROP INDEX matchup_objectives_oid_sid_mid_index;").run();
    }
}