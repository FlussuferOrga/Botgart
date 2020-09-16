import * as moment from "moment";
import * as Util from "../Util";
import { AbstractDbRepository } from "./AbstractDbRepository";

export class AchievementRepository extends AbstractDbRepository{
    /**
     * Inserts a granted achievement into the DB.
     * achievementName: name of the achievement. No checks are done here -- could be an invalid achievement name!
     * gw2account: the account to award the achievement to.
     * awardedBy: Discord ID of the user who issued the grant-command, if any. Having nothing here implies the achievement was awarded automatically by fulfilling the requirements.
     * timestamp: when the achievement was granted.
     * returns: ID of the newly created row. Note that this row is autoincrementally, so no ID will be repeated over the lifespan of the DB.
     */
    public awardAchievement(achievementName: string, gw2account: string, awardedBy: string, timestamp: moment.Moment): number {
        return this.execute(db => {
            db.prepare("INSERT INTO player_achievements(achievement_name, gw2account, awarded_by, timestamp) VALUES(?,?,?,datetime(?, 'localtime'))")
                .run(achievementName, gw2account, awardedBy, Util.momentToLocalSqliteTimestamp(timestamp));
            return db.prepare(`SELECT last_insert_rowid() AS id`).get().id;
        });
    }

    /**
     * Checks the state of an achievement for a player.
     * That is: it returns all instances the player has of that achievement,
     * or in other words: an empty result implies the player having not unlocked the achievement yet.
     * returns: the info about each instance (NOTE: the pap fields are not in use yet.)
     */
    public checkAchievement(achievementName: string, gw2account: string)
        : {
        awarded_by: string,
        timestamp: string,
        guild: string,
        channel: string,
        message: string
    }[]
    {
        return this.execute(db => db.prepare(`
            SELECT 
                pa.awarded_by,
                pa.timestamp,
                pap.guild,
                pap.channel,
                pap.message
              FROM 
                player_achievements AS pa 
                LEFT JOIN player_achievement_posts AS pap
                  ON pa.player_achievement_id = pap.player_achievement_id
              WHERE 
                achievement_name = ? 
                AND gw2account = ?
        `).all(achievementName, gw2account));
    }

    /**
     * Retrieves all grouped instances of achievements the player has been awarded.
     * Grouped by the achievement name, including the count.
     * gw2account: player to retrieve the achievements for.
     * returns: array of achievement, group by the achievemet name with the count included.
     */
    public getPlayerAchievements(gw2account: string)
        : {times_awarded: number, achievement_name: string}[]
    {
        return this.execute(db => db.prepare(`
                SELECT 
                    COUNT(*) AS times_awarded,
                    achievement_name
                FROM
                    player_achievements
                WHERE
                    gw2account = ?
                GROUP BY
                    achievement_name      
            `).all(gw2account));
    }

    /**
     * Delete a specific achievement instance by ID.
     * playerAchievementID: the ID of the row to delete.
     * returns: if the passed ID was valid, the deleted row is returned.
     */
    public deletePlayerAchievement(playerAchievementID: number)
        :  {
        player_achievement_id: number,
        achievement_name: string,
        gw2account: string,
        awarded_by: string,
        timestamp: string
    }
    {
        return this.execute(db =>
            db.transaction((_) => {
                const achievementData = db.prepare(`
                    SELECT
                        player_achievement_id,
                        achievement_name,
                        gw2account,
                        awarded_by,
                        timestamp
                    FROM 
                        player_achievements
                    WHERE
                        player_achievement_id = ?
                `).get(playerAchievementID);
                db.prepare(`
                    DELETE FROM 
                        player_achievements
                    WHERE
                        player_achievement_id = ?
                `).run(playerAchievementID);
                return achievementData;
            })(null))
    }

    /**
     * Revokes an achievement by name; that is: all instances of that achievement.
     * achievementName: name of the achievement.
     * gw2account: player to revoke the achievement from.
     * returns: how many rows were deleted in the process.
     */
    public revokePlayerAchievements(achievementName: string, gw2account: string): number {
        return this.execute(db =>
            db.transaction((_) => {
                db.prepare(`
                    DELETE FROM 
                        player_achievements
                    WHERE
                        achievement_name = ?
                        AND gw2account = ?
                `).run(achievementName, gw2account);
                return db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null))
    }

    /**
     * Deletes all information related to the achievements of a player.
     * That is: all their leads and all their achievements the have been awarded so far.
     * returns: tuple of [0]: number of removed leads, [1]: number of revoked achievements
     */
    public deleteAchievementInformation(gw2account: string): [number, number] {
        const removedLeads: number = this.execute(db =>
            db.transaction((_) => {
                db.prepare(`
                                        DELETE FROM 
                                            ts_leads
                                        WHERE
                                            gw2account = ?
                                    `).run(gw2account);
                return db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null));
        const revokedAchievements: number = this.execute(db =>
            db.transaction((_) => {
                db.prepare(`
                                            DELETE FROM 
                                                player_achievements
                                            WHERE
                                                gw2account = ?
                                        `).run(gw2account);
                return db.prepare(`SELECT changes() AS changes`).get().changes;
            })(null));
        return [removedLeads, revokedAchievements];

    }
}