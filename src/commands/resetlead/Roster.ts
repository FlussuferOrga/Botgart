import discord, { ColorResolvable } from "discord.js";
import EventEmitter from "events";
import { getConfig } from "../../config/Config.js";
import * as L from "../../Locale.js";
import * as Util from "../../util/Util.js";
import { ResetLeader } from "./ResetLeader.js";
import * as ResetUtil from "./ResetUtil.js";
import { WvwMap } from "./WvwMap.js";
import { DateTime, WeekNumbers } from "luxon";

const EMPTY_MESSAGE = "_ _";

export interface RosterEvents {
    addleader: [roster: Roster, map: WvwMap, leader: ResetLeader];
    removeleader: [roster: Roster, map: WvwMap, leader: ResetLeader];
    togglevisibility: [roster: Roster, leaders: ResetLeader[]];
}

export class Roster extends EventEmitter {
    public readonly leads: { [key: string]: [WvwMap, Util.GeneralSet<ResetLeader>] };
    public readonly weekNumber: number;
    public readonly year: number;

    public readonly resetDateTime: DateTime;

    public constructor(weekNumber: number, year: number) {
        super();
        this.weekNumber = weekNumber;
        this.year = year;
        this.leads = {};
        for (const m of WvwMap.getMaps()) {
            this.leads[m.name] = [m, new Util.GeneralSet<ResetLeader>()];
        }

        this.resetDateTime = ResetUtil.getResetForWeek(this.weekNumber as WeekNumbers, this.year);
    }

    /**
     * @returns the date for the reset this roster represents.
     */
    public getResetDateTime(): DateTime {
        return this.resetDateTime; // better hand out a close..
    }

    /**
     * @returns true iff the reset of this roster is the next reset.
     */
    public isUpcoming(): boolean {
        return this.resetDateTime > DateTime.now();
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
            const [, leads] = this.leads[m.name];
            leaders.push(...Array.from(leads).filter((l) => l.name === name));
        }
        return leaders;
    }

    /**
     * @returns all leaders for all maps.
     */
    public getLeaders(): [WvwMap, ResetLeader][] {
        const leaders: [WvwMap, ResetLeader][] = [];
        for (const m of WvwMap.getMaps()) {
            const [, leads] = this.leads[m.name];
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
                const [map, mapLeads] = this.leads[m];
                if (mapLeads.has(leader)) {
                    mapLeads.delete(leader);
                    this.emit("removeleader", this, map, leader);
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
        return Object.keys(this.leads)
            .filter((k) => this.leads[k][1].size() === 0)
            .map((k) => this.leads[k][0]);
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
    private getEmbedColour(): ColorResolvable {
        const colours: ColorResolvable[] = ["#00ff00", "#cef542", "#f5dd42", "#f58442", "#ff0000"];
        return colours[this.emptyMapCount()];
    }

    /**
     * @returns the message embed for the roster.
     */
    public toMessageEmbed(): discord.EmbedBuilder {
        const timezone = getConfig().get().timeZone;
        const resetDateTime = this.getResetDateTime();
        const displayedDateTime = resetDateTime.setZone(timezone).toFormat("dd.MM.yyyy HH:mm ZZZZ");
        const re = new discord.EmbedBuilder()
            .setColor(this.getEmbedColour())
            .setAuthor({ name: "Reset Commander Roster" })
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber} (${displayedDateTime})`)
            // .setThumbnail("https://wiki.guildwars2.com/images/5/54/Commander_tag_%28blue%29.png")
            .setDescription(L.get("RESETLEAD_HEADER"));
        for (const mname in this.leads) {
            const [wvwmap, leads] = this.leads[mname];
            const mapText = `${wvwmap.emote} ${wvwmap.getLocalisedName(" | ", false)}`;
            const leadsText =
                leads.size() === 0
                    ? "-"
                    : Array.from(leads)
                          .map((l) => (l.isOpenlyVisible() ? `${l.name} 📣` : l.name))
                          .join(", ");
            re.addFields([
                { name: mapText, value: leadsText },
                { name: "\u200b", value: "\u200b" },
            ]);
        }
        return re;
    }

    public toMessage() {
        const result: ResetLeader[] = [];
        for (const mname in this.leads) {
            const [, leads] = this.leads[mname];
            result.push(...leads);
        }

        const uniqueResult = [...new Set(result.map((value) => value.name))];
        if (uniqueResult.length > 0) {
            return uniqueResult.join(",");
        } else {
            return EMPTY_MESSAGE;
        }
    }

    public on<Event extends keyof RosterEvents>(event: Event, listener: (...args: RosterEvents[Event]) => void): this {
        return super.on(event, listener);
    }

    public once<Event extends keyof RosterEvents>(event: Event, listener: (...args: RosterEvents[Event]) => void): this {
        return super.once(event, listener);
    }

    public emit<Event extends keyof RosterEvents>(event: Event, ...args: RosterEvents[Event]): boolean {
        return super.emit(event, ...args);
    }

    public off<Event extends keyof RosterEvents>(event: Event, listener: (...args: RosterEvents[Event]) => void): this {
        return super.off(event, listener);
    }
}
