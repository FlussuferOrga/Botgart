import { logger } from "../../util/Logging";
import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

const LOG = logger();

/**
 * convert Time Data to ISO
 */
export class Patch13 extends DBPatch {
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

    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return Array.from(Patch13.TABLE_COLUMNS.values())
            .filter((entry, _) => this.hasColumnDataNonIsoTimestamps(entry[0], entry[1]))
            .map(value => {
                LOG.info(`Table ${value[0]} Column ${value[1]} has bad timestamps`);
                return value;
            }).length == 0;
    }

    protected hasColumnDataNonIsoTimestamps(table: string, column: string) {
        const runResult = this.connection.prepare(
            `select count(*) as "count"
             from ${table}
             where not (${column} like '%T%+%' or ${column} like '%T%Z');`
        )
            .get();
        LOG.info(`Table ${table} Column ${column} has ${runResult.count} bad timestamps`);

        return runResult.count > 0;
    }

    protected async apply(): Promise<void> {
        this.dbbegin();
        Patch13.TABLE_COLUMNS.forEach((arr, idx) => {
            const [table, column] = arr;
            LOG.debug(`Patching ${table}.${column}`);
            this.run(
                `UPDATE ${table}
                 SET ${column} = strftime('%Y-%m-%dT%H:%M:%SZ', datetime(${column}, 'utc'))
                 where not (${column} like '%T%+%' or ${column} like '%T%Z');
                `);
        });
    }

    private run(stmt: string) {
        this.connection.prepare(stmt).run();
    }
}