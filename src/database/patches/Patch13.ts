import {Database} from "../Database";
import {DBPatch} from "./DBPatch";

/**
 * Fishing System
 */
export class Patch13 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        for (let view of this.views) {
            if (this.viewExists(view)){
                return false;
            }
        }
        return true;

    }

    private readonly views = ["command_permissions_agg", "captured_objectives", "map_ticks", "total_ticks", "total_stats"];



    protected async apply(): Promise<void> {
        this.dbbegin();
        for (let string of this.views) {
            this.connection.prepare("DROP VIEW IF EXISTS "+string).run();
        }
        this.dbcommit();
        this.connection.prepare("VACUUM;").run();
    }
}
