import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Fishing System
 */
export class Patch11 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    private readonly tables = [
        "environment_variables",
        "matchup_factions",
        "matchup_objectives",
        "matchup_stats",
        "matchups",
        "objectives_snapshots",
        "player_achievement_posts",
        "player_achievements",
        "player_activities",
        "stats_snapshots",
        "ts_leads",
        "wvw_factions",
        "wvw_maps"
    ];

    protected async satisfied(): Promise<boolean> {
        for (const table of this.tables) {
            if (this.tableExists(table)) {
                return false;
            }
        }
        return true;
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        this.connection.pragma("foreign_keys = OFF");
        for (const table of this.tables) {
            this.connection.prepare("DROP TABLE IF EXISTS " + table + ";").run();
        }
        this.connection.pragma("foreign_keys = ON");
        this.dbcommit();
        this.connection.prepare("VACUUM;").run();
    }
}