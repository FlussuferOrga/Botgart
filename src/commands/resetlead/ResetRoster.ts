import * as dateFormat from "dateformat";
import * as discord from "discord.js";
import * as events from "events";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import * as Util from "../../Util";
//import * as moment from 'moment';
import moment = require('moment');

/**
Testcases:

*/
const WITHDRAW = "❌"; // cross
const VISIBLE = "📣"; // megaphone

export class ResetLeader implements Util.Equalable<ResetLeader> {
    public readonly name: string;
    private visible: boolean;    

    public isOpenlyVisible(): boolean {
        return this.visible;
    }

    public setVisiblity(v : boolean): void {
        this.visible = v;
    }

    public toggleVisibility(): void {
        this.visible = !this.visible;
    }

    public constructor(name: string, visible: boolean) {
        this.name = name;
        this.visible = visible;
    }

    public equals(other: ResetLeader): boolean {
        return other.name === this.name;
    }
}

export class WvWMap {
    static readonly RedBorderlands = new WvWMap("📕", "RED_BORDERLANDS", ["RBL"]);
    static readonly BlueBorderlands = new WvWMap("📘", "BLUE_BORDERLANDS", ["BBL"]);
    static readonly GreenBorderlands = new WvWMap("📗", "GREEN_BORDERLANDS", ["GBL"]);
    static readonly EternalBattlegrounds = new WvWMap("📙", "ETERNAL_BATTLEGROUNDS", ["EBG"]);

    static getMaps(): WvWMap[] {
        return [WvWMap.RedBorderlands, WvWMap.BlueBorderlands, WvWMap.GreenBorderlands, WvWMap.EternalBattlegrounds];
    }

    static getMapNames(): string[] {
        return WvWMap.getMaps().map(m => m.name);
    }

    static getAllMapNames(): string[] {
        return WvWMap.getMaps().map(m => m.getAllNames())
                               .reduce((acc,m) => acc.concat(m), []);
    }

    static getMapByEmote(emote: string): WvWMap {
        return WvWMap.getMaps().filter(m => m.emote === emote)[0] // yields undefined if no match
    }

    static getMapByName(name: string): WvWMap {
        return WvWMap.getMaps().filter(m => m.getAllNames().includes(name))[0] // yields undefined if no match
    }

    public readonly emote: string;
    public readonly name: string;
    public readonly aliases: string[];

    public getLocalisedName(separator = "\n", flags = true): string {
        return L.get(this.name, [], separator, flags);
    }

    public getAllNames(): string[] {
        return this.aliases.concat([this.name]);
    }

    private constructor(emote: string, name: string, aliases: string[]) {
        this.emote = emote;
        this.name = name;
        this.aliases = aliases;
    }
}

export class Roster extends events.EventEmitter {
    public readonly leads: {[key: string] : [WvWMap, Util.GeneralSet<ResetLeader>]};
    public readonly weekNumber: number;
    public readonly year: number;

    public constructor(weekNumber: number, year: number) {
        super();
        this.weekNumber = weekNumber;
        this.year = year;
        this.leads = {};
        for(const m of WvWMap.getMaps()) {
            this.leads[m.name] = [m, new Util.GeneralSet<ResetLeader>()];
        }
    }

    /**
    * @returns the date for the reset this roster represents.
    */
    public getResetDate() {
        return Util.getResetDay(this.weekNumber, this.year);
    }

    /**
    * @returns true iff the reset of this roster happens in the future.
    */
    public isFuture() : boolean {
        const now: Date = new Date();
        return this.weekNumber <= Util.getNumberOfWeek(now) && this.year <= now.getFullYear();
    }

    /**
    * @returns true iff the reset of this roster is the next reset.
    */
    public isUpcoming() : boolean {
        return Util.compareDatesWithoutTime(this.getResetDate(), Util.getNextResetDate());
    }

    /**
    * @returns all leaders for a specific map.
    */
    public getMapLeaders(map: WvWMap) : Util.GeneralSet<ResetLeader> {
        return this.leads[map.name][1];
    }

    /**
    * @returns all instances of a certain leader found by name.
    */
    public findLeader(name: string): ResetLeader[] {
        const leaders: ResetLeader[] = [];
        for(const m of WvWMap.getMaps()) {
            const [wvwmap, leads] = this.leads[m.name];
            leaders.push(...Array.from(leads).filter(l => l.name === name));
        }
        return leaders;
    }

    /**
    * @returns all leaders for all maps.
    */
    public getLeaders(): [WvWMap, ResetLeader][] {
        const leaders: [WvWMap, ResetLeader][] = [];
        for(const m of WvWMap.getMaps()) {
            const [wvwmap, leads] = this.leads[m.name];
            for(const l of leads) {
                leaders.push([m, l]);
            }
        }
        return leaders;
    }

    public toggleLeaderVisibility(formattedName: string): void {
        const leaders: ResetLeader[] = this.findLeader(formattedName);
        for(let l of leaders) {
            l.toggleVisibility();
        }
        if(leaders.length > 0) {
            this.emit("togglevisibility", this, leaders);
        }
    }

    /**
    * Adds a leat to a particular map. 
    * @param map the map to add the leader to. 
    * @param leader the leader to add to the map.
    */
    /*
    public addLead(map: WvWMap, leader: ResetLeader): void {
        if(map && map.name in this.leads) {
            this.leads[map.name][1].add(leader);
            this.emit("addleader", this, map, leader);
        }
    }
    */
    public addLeadByName(map: WvWMap, leaderName: string): void {
        // if the player is already registered on another map, take their visibility state
        const former = this.findLeader(leaderName);
        const visible: boolean = former.length > 0 && former[0].isOpenlyVisible();
        const leader: ResetLeader = new ResetLeader(leaderName, visible);
        this.addLead(map, leader);
    }

    public addLead(map: WvWMap, leader: ResetLeader): void {
        if(map && map.name in this.leads) {
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
    public removeLead(map: WvWMap | undefined, leader: ResetLeader): void {
        if(map === undefined) {
            for(const m in this.leads) {
                this.leads[m][1].delete(leader);
                this.emit("removeleader", this, m, leader);
            }
        } else {
            this.leads[map.name][1].delete(leader)  
            this.emit("removeleader", this, map, leader);  
        }
    }

    public removeLeadByName(map: WvWMap | undefined, leaderName: string): void {
        this.removeLead(map, new ResetLeader(leaderName, false));
    }

    /**
    * @returns all maps for which no leader has been determined yet. 
    */
    private emptyMaps(): WvWMap[] {
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
        const re = new discord.MessageEmbed()
            .setColor(this.getEmbedColour())
            .setAuthor("Reset Commander Roster")
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber} (${moment(this.getResetDate()).format("DD.MM.YYYY")})`)
            //.setThumbnail("https://wiki.guildwars2.com/images/5/54/Commander_tag_%28blue%29.png")
            .setDescription(L.get("RESETLEAD_HEADER"))
        for(const mname in this.leads) {
            const [wvwmap, leads] = this.leads[mname];
            re.addField(`${wvwmap.emote} ${wvwmap.getLocalisedName(" | ", false)}`, leads.size() === 0 ? "-" : Array.from(leads)
                                                                                                                    .map(l => l.isOpenlyVisible() ? `${l.name} 📣` : l.name)
                                                                                                                    .join(", "))
              .addField('\u200b', '\u200b'); // discord.js v12 version of addBlankField()
        }
        return re;
    }
}

export class ResetRoster extends BotgartCommand {
    private static readonly UPDATE_DELAY = 1000;

    private messages: {[key: string]: Roster};
    private emotes: string[];
    private syncScheduled: boolean;

    constructor() {
        super("resetroster", {
            aliases: ["resetroster"],
            args: [
                {
                    id: "channel",
                    type: "channel"
                }, 
                {
                    id: "weekNumber",
                    type: "integer",
                    default: undefined
                },
                {
                    id: "year",
                    type: "integer",
                    default: undefined
                }
            ],
            userPermissions: ["ADMINISTRATOR"]

        },
        {
            cronable: true
        }
        );
        this.messages = {};
        this.emotes = WvWMap.getMaps().map(m => m.emote);
        this.emotes.push(WITHDRAW);
        this.emotes.push(VISIBLE);
        this.syncScheduled = false;
    }

    checkArgs(args) {
        return !args || !args.channel || !(args.channel instanceof discord.TextChannel) ? L.get(this.helptextKey()) : undefined;
    }

    public init(client: BotgartClient): void {
        client.guilds.cache.forEach(
            g => Promise.all(client.rosterRepository.getActiveRosters(g))
                .then(ars => ars.filter(([dbRoster, _, __]) => dbRoster !== undefined)
                   .forEach(([dbRoster, dbChannel, dbMessage]) => {
                       client.setRoster(dbRoster.weekNumber, dbRoster.year, dbChannel.guild, dbMessage, dbRoster);
                       this.watchRoster(<discord.Guild>dbMessage.guild, dbRoster); // can not be initialised in direct messages anyway
                       this.watchMessage(dbMessage, dbRoster);
                    })));
    }    

    private syncToTS3(roster: Roster): void {       
        const cl = this.getBotgartClient();
        // users are stored as <@123123123123> when clicking themselves, or as <!123123123123> when added through command. 
        // Resolve if possible.
        const resolveUser: (string) => string = sid => {
            const idregxp = /<[@!](\d+)>/;
            const match = idregxp.exec(sid);
            let user = sid;
            if(match !== null) {
                const resolved: discord.GuildMember | undefined = Util.resolveDiscordUser(cl, match[1])
                if(resolved !== undefined) {
                    user = resolved.displayName;
                }
            }
            return user;
        } 
        cl.getTS3Connection().post("resetroster", {
            "date": dateFormat.default(Util.getResetDay(roster.weekNumber, roster.year), "dd.mm.yy"),
            "rbl": Array.from(roster.getMapLeaders(WvWMap.RedBorderlands)).map(l => resolveUser(l.name)),
            "gbl": Array.from(roster.getMapLeaders(WvWMap.GreenBorderlands)).map(l => resolveUser(l.name)),
            "bbl": Array.from(roster.getMapLeaders(WvWMap.BlueBorderlands)).map(l => resolveUser(l.name)),
            "ebg": Array.from(roster.getMapLeaders(WvWMap.EternalBattlegrounds)).map(l => resolveUser(l.name))
        });
    }

    private watchRoster(guild: discord.Guild, roster: Roster): void {
        const cl = this.getBotgartClient();
        const dbRoster = cl.getRoster(guild, roster.weekNumber, roster.year);
        if(dbRoster === undefined) {
            Util.log("error", `Received request to watch roster for week ${roster.weekNumber}, but no meta information was found in the database.`)
            return;
        }
        const [_, message, __] = dbRoster;
        const refresh = (r: Roster, map: string, p: string) => {
            setTimeout(function() { // no arrow function, as we need to bind()!
                // only updating post, DB, and TS3 in fixed intervals
                // reduces strain if people are being funny by clicking around wildly
                // and only updates once if someone who was tagged for multiple maps 
                // pulls back, instead for once for every map.
                if(this.syncScheduled) return;
                this.syncScheduled = true;
                cl.rosterRepository.upsertRosterPost(guild, r, message);
                message.edit(r.toMessageEmbed());

                if(roster.isUpcoming()) {
                    this.syncToTS3(roster);
                }
                this.syncScheduled = false;
            }.bind(this), ResetRoster.UPDATE_DELAY);
        };
        roster.on("addleader", refresh);
        roster.on("removeleader", refresh);
        roster.on("togglevisibility", refresh);
    }

    private watchMessage(message: discord.Message, roster: Roster): void {
        Util.log("debug", "Now watching message {0} as roster for week {1}.".formatUnicorn(message.url, roster.weekNumber));
        message.createReactionCollector(e => 
            this.emotes.includes(e.emoji.name) , {}).on("collect", (r) => {
                const m = WvWMap.getMapByEmote(r.emoji.name);
                r.users.cache.filter(u => u.id !== this?.client?.user?.id).map(u => { // reactions coming from anyone but the bot
                    const formattedName = Util.formatUserPing(u.id);
                    if(!m) {
                        if(r.emoji.name === WITHDRAW) { // X -> user wants to remove themselves from roster
                            roster.removeLead(undefined, new ResetLeader(formattedName, false)); // equality is defined by name, so wrapping the name in ResetLeader is sufficient to find all instances of that user
                        } else if(r.emoji.name === VISIBLE) {
                            roster.toggleLeaderVisibility(formattedName);
                        }                      
                    } else {
                        roster.addLeadByName(m, formattedName);
                    }
                    r.users.remove(u);
                });
            });
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const currentWeek = Util.getNumberOfWeek();
        const rosterWeek = !args.weekNumber || args.weekNumber < currentWeek ? currentWeek : args.weekNumber;
        const rosterYear = !args.year ? new Date().getFullYear() : args.year;
        this.getBotgartClient().rosterRepository.getRosterPost(guild, rosterWeek, rosterYear).then(dbEntry => {
            if(dbEntry === undefined) {
                // no roster for this guild+week -> create one
                const roster = new Roster(rosterWeek, rosterYear);
                (<discord.TextChannel>args.channel).send(roster.toMessageEmbed())
                .then(async (mes: discord.Message) => {
                    for(const e of this.emotes) {
                        await mes.react(e);
                    }
                    this.getBotgartClient().setRoster(roster.weekNumber, roster.year, guild, mes, roster);
                    this.getBotgartClient().rosterRepository.upsertRosterPost(guild, roster, mes); // initial save
                    this.watchMessage(mes, roster);
                    this.watchRoster(guild, roster);
                });
                if(roster.isUpcoming()) {
                    this.syncToTS3(roster);
                }
            } else {
                const [dbRoster, dbChannel, dbMessage] = dbEntry;
                // there is already a roster-post for this guild+week -> do nothing, log warning
                Util.log("warning", `Tried to initialise roster-post for calendar week ${rosterWeek} for guild '${guild.name}' in channel '${args.channel.name}'. But there is already such a post in channel '${dbChannel.name}'`);
                this.reply(message, responsible, L.get("ROSTER_EXISTS", [dbMessage.url]));
            }
        });
    }

    serialiseArgs(args) {
        const clone = Object.assign({}, args);
        clone.channel = {guild: args.channel.guild.id, channel: args.channel.id};
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        const args = JSON.parse(jsonargs);
        const guild: discord.Guild | undefined = this.client.guilds.cache.find(g => g.id == args.channel.guild);
        if(guild === undefined) {
            Util.log("warning", `The guild with id ${args.channel.id} which is put down as roster argument is unknown to me. Have I been kicked?`);
            args.channel = undefined;
        } else {
            args.channel = guild.channels.cache.find(c => c.id == args.channel.channel);    
        }
        return args;
    }
}

module.exports = ResetRoster;
exports.Roster = Roster;
module.exports.Roster = Roster;
module.exports.WvWMap = WvWMap;
module.exports.ResetLeader = ResetLeader;