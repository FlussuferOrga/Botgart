import * as moment from "moment";
import * as Util from "../util/Util";
import { AbstractDbRepository } from "./AbstractDbRepository";
import { Registration } from "./RegistrationRepository";

export class TsLeadRepository extends AbstractDbRepository {
    /**
     * Adds the duration of a TS lead to the database.
     * gw2account: player to add the lead to.
     * start: Moment when the tag-up was registered.
     * end: Moment when the tag-down was registered.
     * tsChannel: channel in which they did their lead.
     */
    public addLead(gw2account: string, start: moment.Moment, end: moment.Moment, tsChannel: string): void {
        return this.execute(db => db.prepare("INSERT INTO ts_leads(gw2account, ts_channel, start, end) VALUES(?, ?, ?,?)")
            .run(gw2account, tsChannel, Util.momentToIsoString(start), Util.momentToIsoString(end)));
    }

    /**
     * Total time a player tagged up over all channels in seconds.
     * gw2account: player to check
     * returns: seconds the player has tagged up or 0 if the player is unknown.
     */
    public getTotalLeadTime(gw2account: string): number {
        return this.execute(db => db.prepare(`
            SELECT COALESCE(SUM(strftime('%s', end) - strftime('%s', start)), 0) AS total
            FROM ts_leads
            WHERE gw2account = ?
        `).get(gw2account).total);
    }

    /**
     * Checks how long the last lead of the player lasted.
     * gw2account: the account to check for.
     * returns: number in milliseconds.
     */
    public getLastLeadDuration(gw2account: string): number {
        return this.execute(db => db.prepare(`
            SELECT COALESCE(strftime('%s', end) - strftime('%s', start), 0) AS duration
            FROM ts_leads
            WHERE gw2account = ?
            ORDER BY ts_lead_id DESC
            LIMIT 1
        `).get(gw2account).duration);
    }

    public getCommandersDuring(start: moment.Moment, end: moment.Moment): Lead[] {
        return this.execute(db => db.prepare(`
            SELECT r.id,
                   r.user,
                   r.guild,
                   r.api_key,
                   r.gw2account,
                   r.registration_role,
                   r.account_name,
                   r.created,
                   tl.ts_channel,
                   tl.start,
                   tl.end
            FROM ts_leads AS tl
                     JOIN registrations AS r ON tl.gw2account = r.gw2account
            WHERE tl.start BETWEEN ? AND ?
        `).all(Util.momentToIsoString(start), Util.momentToIsoString(end)));
    }
}

export interface Lead extends Registration {
    readonly channel: string,
    readonly start: string,
    readonly end: string
}
