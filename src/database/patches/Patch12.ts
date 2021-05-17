import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

/**
 * Manual Patch Order. Tried implementing it but was not working via sqlite libary.
 * Use https://sqlitestudio.pl/ to change columns to strftime('%Y-%m-%dT%H:%M:%SZ','now')
 */
export class Patch12 extends DBPatch {
    private static COLUMN_DEFAULT = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";
    private static TABLE_COLUMNS = [
        ["command_permissions", "timestamp"],
        ["cronjobs", "created"],
        ["faqs", "created"],
        ["faq_keys", "created"],
        ["caught_fish", "timestamp"],
        ["matchups", "start"],
        ["matchups", "end"],
        ["objectives_snapshots", "timestamp"],
        ["permanent_roles", "created"],
        ["player_achievements", "timestamp"],
        ["player_activities", "start"],
        ["player_activities", "end"],
        ["registrations", "created"],
        ["stats_snapshots", "timestamp"],
        ["ts_leads", "start"],
        ["ts_leads", "end"],
        ["matchup_objectives", "last_flipped"],
    ];

    private state: [string, string, boolean][] = [];

    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        this.readState();
        return this.state.find(value => value[2]) !== undefined;
    }

    private readState() {
        this.state = Patch12.TABLE_COLUMNS.map(value => {
            const [tbl, col] = value;
            return [tbl, col, this.columnHasDefault(tbl, col, Patch12.COLUMN_DEFAULT)];
        });
    }

    protected async apply(): Promise<void> {
        if (this.state.length == 0) {
            this.readState();
        }
        const result = this.state.filter(value => !value[2]);
        throw Error("Please manually change the following column defaults to: " + Patch12.COLUMN_DEFAULT + " :\n"
            + result.map(value => value[0] + "." + value[1]).join("\n"));
    }
}