import discord from "discord.js";
import events from "events";
import moment, { Moment } from "moment-timezone";
import { getConfig } from "../../config/Config";
import * as L from "../../Locale";
import * as Util from "../../util/Util";
import { ResetLeader } from "./ResetLeader";
import * as ResetUtil from "./ResetUtil";
import { WvwMap } from "./WvwMap";

export class Roster extends events.EventEmitter {
    public readonly leads: { [key: string]: [WvwMap, Util.GeneralSet<ResetLeader>] };
    public readonly weekNumber: number;
    public readonly year: number;

    public readonly resetMoment: Moment;

    public constructor(weekNumber: number, year: number) {
        super();
        this.weekNumber = weekNumber;
        this.year = year;
        this.leads = {};
        for (const m of WvwMap.getMaps()) {
            this.leads[m.name] = [m, new Util.GeneralSet<ResetLeader>()];
        }

        this.resetMoment = ResetUtil.getResetForWeek(this.weekNumber, this.year);
    }

    /**
     * @returns the date for the reset this roster represents.
     */
    public getResetMoment(): Moment {
        return this.resetMoment.clone(); //better hand out a close..
    }

    /**
     * @returns true iff the reset of this roster is the next reset.
     */
    public isUpcoming(): boolean {
        return this.resetMoment.isSameOrAfter(moment());
    }

    /**
     * @returns all leaders for a specific map.
     */
    public getMapLeaders(map: WvwMap): Util.GeneralSet<ResetLeader> {
        return this.leads[map.name][1];
    }

    /**
     * @returns all instances of a certain leader found by name.
     */
    public findLeader(name: string): ResetLeader[] {
        const leaders: ResetLeader[] = [];
        for (const m of WvwMap.getMaps()) {
            const [wvwmap, leads] = this.leads[m.name];
            leaders.push(...Array.from(leads).filter(l => l.name === name));
        }
        return leaders;
    }

    /**
     * @returns all leaders for all maps.
     */
    public getLeaders(): [WvwMap, ResetLeader][] {
        const leaders: [WvwMap, ResetLeader][] = [];
        for (const m of WvwMap.getMaps()) {
            const [wvwmap, leads] = this.leads[m.name];
            for (const l of leads) {
                leaders.push([m, l]);
            }
        }
        return leaders;
    }

    public toggleLeaderVisibility(formattedName: string): void {
        const leaders: ResetLeader[] = this.findLeader(formattedName);
        for (const l of leaders) {
            l.toggleVisibility();
        }
        if (leaders.length > 0) {
            this.emit("togglevisibility", this, leaders);
        }
    }

    public addLeadByName(map: WvwMap, leaderName: string): void {
        // if the player is already registered on another map, take their visibility state
        const former = this.findLeader(leaderName);
        const visible: boolean = former.length > 0 && former[0].isOpenlyVisible();
        const leader: ResetLeader = new ResetLeader(leaderName, visible);
        this.addLead(map, leader);
    }

    public addLead(map: WvwMap, leader: ResetLeader): void {
        if (map && map.name in this.leads) {
            this.leads[map.name][1].add(leader);
            this.emit("addleader", this, map, leader);
        }
    }

    /**
     * Removes a lead from one of all maps.
     * @param map to remove the leader from.
     *            If undefined is passed, the leader is removed from all maps.
     * @param leader the leader to remove.
     */
    public removeLead(map: WvwMap | undefined, leader: ResetLeader): void {
        if (map === undefined) {
            for (const m in this.leads) {
                const mapLeads = this.leads[m][1];
                if (mapLeads.has(leader)) {
                    mapLeads.delete(leader);
                    this.emit("removeleader", this, m, leader);
                }
            }
        } else {
            this.leads[map.name][1].delete(leader);
            this.emit("removeleader", this, map, leader);
        }
    }

    public removeLeadByName(map: WvwMap | undefined, leaderName: string): void {
        this.removeLead(map, new ResetLeader(leaderName, false));
    }

    /**
     * @returns all maps for which no leader has been determined yet.
     */
    private emptyMaps(): WvwMap[] {
        return Object.keys(this.leads).filter(k => this.leads[k][1].size() === 0).map(k => this.leads[k][0]);
    }

    /**
     * @returns the number of empty maps.
     */
    private emptyMapCount(): number {
        return this.emptyMaps().length;
    }

    /**
     * @returns the hex string of the colour to use for the embed based on how many maps are empty.
     */
    private getEmbedColour(): string {
        return ["#00ff00", "#cef542", "#f5dd42", "#f58442", "#ff0000"][this.emptyMapCount()];
    }

    /**
     * @returns the message embed for the roster.
     */
    public toMessageEmbed(): discord.MessageEmbed {
        const timezone = getConfig().get().timeZone;
        const resetDateTime = this.getResetMoment();
        const displayedDateTime = resetDateTime.tz(timezone).format("DD.MM.YYYY HH:mm z");
        const re = new discord.MessageEmbed()
            .setColor(this.getEmbedColour())
            .setAuthor("Reset Commander Roster")
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber} (${displayedDateTime})`)
            //.setThumbnail("https://wiki.guildwars2.com/images/5/54/Commander_tag_%28blue%29.png")
            .setDescription(L.get("RESETLEAD_HEADER"));
        for (const mname in this.leads) {
            const [wvwmap, leads] = this.leads[mname];
            re.addField(`${wvwmap.emote} ${wvwmap.getLocalisedName(" | ", false)}`, leads.size() === 0 ? "-" : Array.from(leads)
                .map(l => l.isOpenlyVisible() ? `${l.name} 📣` : l.name)
                .join(", "))
                .addField("\u200b", "\u200b"); // discord.js v12 version of addBlankField()
        }
        return re;
    }

    public toMessage() {
        const result: ResetLeader[] = [];
        for (const mname in this.leads) {
            const [, leads] = this.leads[mname];
            result.push(...leads);
        }
        const uniqueResult = [...new Set(result.map(value => value.name))];
        return uniqueResult.join(",");
    }
}