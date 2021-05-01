import * as moment from "moment";
import * as Util from "../util/Util";
import { AbstractDbRepository } from "./AbstractDbRepository";

export type FactionColour = "Red" | "Blue" | "Green";

export class MatchupRepository extends AbstractDbRepository{
    public getCurrentMatchup(now: moment.Moment): Matchup | undefined {
        return this.execute(db =>
            db.prepare("SELECT matchup_id, tier, start, end FROM matchups WHERE datetime(?, 'localtime') BETWEEN start AND end").get(Util.momentToLocalSqliteTimestamp(now)));
    }

    public getLatestMatchup(): Matchup | undefined {
        return this.execute(db =>
            db.prepare(`SELECT matchup_id, tier, start, end FROM matchups ORDER BY start DESC LIMIT 1`).get());
    }

    public addMatchup(tier: number, start: moment.Moment, end: moment.Moment, reds: number[], greens: number[], blues: number[]) {
        return this.execute(db => {
            const existingMatch = db.prepare("SELECT matchup_id AS id FROM matchups WHERE start = datetime(?, 'localtime')")
                .get(Util.momentToLocalSqliteTimestamp(start));
            let matchId: number = existingMatch ? existingMatch.id : undefined;
            if(matchId === undefined) {
                db.prepare("INSERT INTO matchups(tier, start, end) VALUES(?, datetime(?, 'localtime'), datetime(?, 'localtime'))")
                    .run(tier,
                        Util.momentToLocalSqliteTimestamp(start),
                        Util.momentToLocalSqliteTimestamp(end));
                matchId = db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
                for(const [worlds, colour] of [[reds, "Red"], [greens, "Green"], [blues, "Blue"]] as const) {
                    for(const worldId of worlds) {
                        this.addMatchupFaction(matchId, worldId, colour);
                    }
                }
            }
        });
    }

    private addMatchupFaction(matchId: number, worldId: number, colour: string) {
        return this.execute(db => db.prepare("INSERT INTO matchup_factions(matchup_id, colour, world_id) VALUES(?,?,?)")
            .run(matchId, colour, worldId));
    }

    public getFactionColour(now: moment.Moment, serverId: number): FactionColour | undefined {
        const row = this.execute(db => db.prepare(`
                SELECT 
                    colour
                FROM 
                    matchup_factions AS mf 
                    JOIN matchups AS m 
                      ON mf.matchup_id = m.matchup_id
                WHERE
                    datetime(?, 'localtime') BETWEEN m.start AND m.end    
                    AND mf.world_id = ?
                    
                `).get(Util.momentToLocalSqliteTimestamp(now), serverId)
        );
        return row ? row.colour : undefined;
    }

    public crashedT3ByCommander(homeWorldId: number,gw2account: string): number {
        const crashed: {count:number} | undefined = this.execute(db => db.prepare(`
                SELECT 
                    tl.gw2account,
                    COUNT(*) AS count
                    
                FROM 
                    captured_objectives AS co 
                    JOIN ts_leads AS tl 
                      ON datetime(new_last_flipped, 'localtime') BETWEEN datetime(tl.start, 'localtime') AND datetime(tl.end, 'localtime')
                    JOIN matchup_factions AS mf
                      ON co.matchup_id = mf.matchup_id
                         AND co.new_owner = mf.colour
                WHERE 
                    old_tier = 3
                    AND mf.world_id = ?
                    AND tl.gw2account = ?
                GROUP BY
                    gw2account
                `).get(homeWorldId, gw2account));
        return crashed !== undefined ? crashed.count : 0;
    }

    public wasCapturedBetween(start: moment.Moment, end: moment.Moment, objectiveId: string, colour: FactionColour): boolean {
        return this.execute(db => db.prepare(`
                SELECT 
                    *
                FROM 
                    captured_objectives
                WHERE
                    objective_id = ?
                    AND new_owner = ?
                    AND datetime(new_last_flipped, 'localtime') BETWEEN datetime(?, 'localtime') AND datetime(?, 'localtime')
                LIMIT
                    1
            `).get(objectiveId, colour, Util.momentToLocalSqliteTimestamp(start), Util.momentToLocalSqliteTimestamp(end))) !== undefined;
    }

    public capturedBetween(start: moment.Moment, end: moment.Moment): Capture[] {
        return this.execute(db => db.prepare(`
                SELECT 
                    *
                FROM
                    captured_objectives
                WHERE 
                    new_last_flipped BETWEEN datetime(?, 'localtime') AND datetime(?, 'localtime')
            `).all(Util.momentToLocalSqliteTimestamp(start), Util.momentToLocalSqliteTimestamp(end)));
    }

    public addStatsSnapshot(): number {
        return this.execute(db =>
            db.transaction((_) => {
                db.prepare("INSERT INTO stats_snapshots DEFAULT VALUES").run();
                return db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
            })(null)
        );
    }

    public addObjectivesSnapshot(): number {
        return this.execute(db =>
            db.transaction((_) => {
                db.prepare("INSERT INTO objectives_snapshots DEFAULT VALUES").run();
                return db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
            })(null)
        );
    }

    /**
     * Determines the colour of a world at a given Moment.
     * The colour is obviously dependend on the matchup at the
     * passed Moment, so this only works iff data about the matchup
     * in question are in the DB.
     * If no Moment is passed, the current UTC local is assumed.
     * If not data matches, undefined is returned.
     * @param worldId the world ID to retrieve the colour for.
     * @param now the timestamp around which to check.
     * @returns a FactionColour, if it can be determined, or undefined
     */
    public getColourOf(worldId: number, now: moment.Moment | undefined = undefined): FactionColour | undefined {
        const timestamp: moment.Moment = now ?? moment.utc().local();
        const res = this.execute(db => db.prepare(`
            SELECT
                mf.colour
            FROM 
                matchup_factions AS mf 
                JOIN matchups AS m 
                  ON mf.matchup_id = m.matchup_id
            WHERE
                mf.world_id = ?
                AND ? BETWEEN m.start AND m.end

        `).get(worldId, Util.momentToLocalSqliteTimestamp(timestamp)));
        return res !== undefined ? res.colour : undefined
    }

    /**
     * Determines the objectives' states around a given moment.
     * That is, based on the snapshot whose timestamp is closest
     * to the passed moment.
     * If no moment is passed, the local NOW is assumed, resulting
     * in the latest state present in the database.
     * @param now: the moment around which the state should be determined
     * @returns: information about the state of all objectives
     */
    public getObjectivesAround(now: moment.Moment | undefined = undefined)
        : {
        snapshot_id: number,
        timestamp: string,
        matchup_objective_id: number,
        matchup_id: number,
        objective_id: number
        map: string, owner: string,
        type: string,
        points_tick: number,
        points_capture: number,
        last_flipped: string,
        yaks_delivered: number,
        tier: number
    }[] {
        if(!now) {
            now = moment.utc().local();
        }
        const ts = Util.momentToLocalSqliteTimestamp(now);
        return this.execute(db => db.prepare(`
            WITH 
            surrounding AS (
                SELECT * FROM
                (SELECT 
                        *
                    FROM
                        objectives_snapshots
                    WHERE
                        datetime(?, 'localtime') >= timestamp
                    ORDER BY
                        timestamp DESC
                    LIMIT 1
                ) before
                UNION ALL
                SELECT * FROM
                (SELECT 
                        *
                    FROM
                        objectives_snapshots
                    WHERE
                        datetime(?, 'localtime') < timestamp
                    ORDER BY
                        timestamp ASC
                    LIMIT 1
                ) after
            ),
            closest AS (
                SELECT 
                    *
                FROM 
                    surrounding
                ORDER BY
                    ABS(julianday(?) - julianday(timestamp))
                LIMIT
                    1
            )
            SELECT 
                c.objectives_snapshot_id AS snapshot_id,
                c.timestamp,
                mo.matchup_objective_id,
                mo.matchup_id,
                mo.objective_id,
                mo.map,
                mo.owner,
                mo.type,
                mo.points_tick,
                mo.points_capture,
                mo.last_flipped,
                mo.yaks_delivered,
                mo.tier
            FROM 
                closest AS c
                JOIN matchup_objectives AS mo
                  ON c.objectives_snapshot_id = mo.snapshot_id
        `).all(ts,ts,ts));
    }

    /**
     * Determines the matchup stats around a given moment.
     * That is, based on the snapshot whose timestamp is closest
     * to the passed moment.
     * If no moment is passed, the local NOW is assumed, resulting
     * in the latest stats present in the database.
     * now: the moment around which the stats should be determined
     * returns: information about the stats (not aggregated)
     */
    public getStatsAround(now: moment.Moment | undefined = undefined)
        : {
        snapshot_id: number,
        timestamp: string,
        matchup_stats_id: number,
        matchup_id: number,
        map: string,
        faction: string,
        deaths: number,
        kills: number,
        victory_points: number
    }[] {
        if(!now) {
            now = moment.utc().local();
        }
        const ts = Util.momentToLocalSqliteTimestamp(now);
        return this.execute(db => db.prepare(`
            WITH 
            surrounding AS (
                SELECT * FROM
                (SELECT 
                        *
                    FROM
                        stats_snapshots
                    WHERE
                        datetime(?, 'localtime') >= timestamp
                    ORDER BY
                        timestamp DESC
                    LIMIT 1
                ) before
                UNION ALL
                SELECT * FROM
                (SELECT 
                        *
                    FROM
                        stats_snapshots
                    WHERE
                        datetime(?, 'localtime') < timestamp
                    ORDER BY
                        timestamp ASC
                    LIMIT 1
                ) after
            ),
            closest AS (
                SELECT 
                    *
                FROM 
                    surrounding
                ORDER BY
                    ABS(julianday(?) - julianday(timestamp))
                LIMIT
                    1
            )
            SELECT 
                c.stats_snapshot_id AS snapshot_id,
                c.timestamp,
                ms.matchup_stats_id,
                ms.matchup_id,
                ms.map,
                ms.faction,
                ms.deaths,
                ms.kills,
                ms.victory_points 
            FROM 
                closest AS c
                JOIN matchup_stats AS ms 
                  ON c.stats_snapshot_id = ms.snapshot_id
        `).all(ts,ts,ts));
    }

    public addMatchupStats(matchId: number, snapshotId: number, map: string, faction: string, deaths: number, kills: number, victoryPoints: number) {
        return this.execute(db => db.prepare("INSERT INTO matchup_stats(matchup_id, snapshot_id, map, faction, deaths, kills, victory_points) VALUES(?,?,?,?,?,?,?)")
            .run(matchId, snapshotId, map, faction, deaths, kills, victoryPoints));
    }

    public addMatchupObjectives(matchId: number, snapshotId: number, objectives: [string, {id: number, owner: string, type: string, points_tick: number, points_capture: number, last_flipped: Date, claimed_by: null, claimed_at: Date, yaks_delivered: number, guild_upgrade: number[]}, number][]) {
        return this.execute(db => {
            const stmt = db.prepare(`INSERT INTO matchup_objectives
                              (matchup_id, snapshot_id, objective_id, map, owner, type, points_tick, points_capture, last_flipped, yaks_delivered, tier)
                              VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
            db.transaction((matchId, objectives) => {
                for(const [mapname, details, tier] of objectives) {
                    stmt.run(matchId,
                        snapshotId,
                        details.id,
                        mapname,
                        details.owner,
                        details.type,
                        details.points_tick,
                        details.points_capture,
                        details.last_flipped,
                        details.yaks_delivered,
                        tier);
                }
            })(matchId, objectives);
        });
    }
}

export type StructureType = "Spawn" | "Ruins" | "Mercenary" | "Sentry" | "Camp" | "Tower" | "Keep" | "Castle";

export interface Capture {
    readonly matchup_objective_id: number,
    readonly matchup_id: number,
    readonly objective_id: number,
    readonly map: string,
    readonly type: StructureType,
    readonly new_snapshot_id: number,
    readonly new_owner: FactionColour,
    readonly new_points_tick: number,
    readonly new_points_capture: number,
    readonly new_last_flipped: string,
    readonly old_snapshot_id: number,
    readonly old_owner: FactionColour,
    readonly old_points_tick: number,
    readonly old_points_capture: number,
    readonly old_last_flipped: string,
    readonly old_yaks: number,
    readonly old_tier: number
}

export interface Matchup {
    readonly matchup_id: number,
    readonly tier: number,
    readonly start: string,
    readonly end: string
}
