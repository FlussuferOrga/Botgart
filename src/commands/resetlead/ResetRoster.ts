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
    public readonly leads: {[key: string] : [WvWMap, Set<string>]};
    public readonly weekNumber: number;
    public readonly year: number;

    public constructor(weekNumber: number, year: number) {
        super();
        this.weekNumber = weekNumber;
        this.year = year;
        this.leads = {};
        for(const m of WvWMap.getMaps()) {
            this.leads[m.name] = [m, new Set<string>()];
        }
    }

    public getResetDate() {
        return Util.getResetDay(this.weekNumber, this.year);
    }

    public isFuture() : boolean {
        const now: Date = new Date();
        return this.weekNumber <= Util.getNumberOfWeek(now) && this.year <= now.getFullYear();
    }

    public isUpcoming() : boolean {
        return Util.compareDatesWithoutTime(this.getResetDate(), Util.getNextResetDate());
    }

    public getMapLeaders(map: WvWMap) : Set<string> {
        return this.leads[map.name][1];
    }

    public getLeaders(): [WvWMap, string][] {
        const leaders = [];
        for(const m of WvWMap.getMaps()) {
            const [wvwmap, leads] = this.leads[m.name];
            for(const l of leads) {
                leaders.push([m.name, l]);
            }
        }
        return leaders;
    }

    public addLead(map: WvWMap, player: string): void {
        if(map && map.name in this.leads) {
            this.leads[map.name][1].add(player);
            this.emit("addleader", this, map, player);
        }
    }

    public removeLead(map: WvWMap, player: string): void {
        if(map === undefined) {
            for(const m in this.leads) {
                this.leads[m][1].delete(player);
                this.emit("removeleader", this, m, player);
            }
        } else {
            this.leads[map.name][1].delete(player)  
            this.emit("removeleader", this, map, player);  
        }
        
    }

    private emptyMaps(): WvWMap[] {
        return Object.keys(this.leads).filter(k => this.leads[k][1].size === 0).map(k => this.leads[k][0]);
    }

    private emptyMapCount(): number {
        return this.emptyMaps().length;
    }

    private getEmbedColour(): string {
        return ["#00ff00", "#cef542", "#f5dd42", "#f58442", "#ff0000"][this.emptyMapCount()];
    }

    public toMessageEmbed(): discord.MessageEmbed {
        const re = new discord.MessageEmbed()
            .setColor(this.getEmbedColour())
            .setAuthor("Reset Commander Roster")
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber} (${moment(this.getResetDate()).format("DD.MM.YYYY")})`)
            //.setThumbnail("https://wiki.guildwars2.com/images/5/54/Commander_tag_%28blue%29.png")
            .setDescription(L.get("RESETLEAD_HEADER"))
        for(const mname in this.leads) {
            const [wvwmap, leads] = this.leads[mname];
            re.addField("{0} {1}".formatUnicorn(wvwmap.emote, wvwmap.getLocalisedName(" | ", false)), leads.size === 0 ? "-" : Array.from(leads).join(", "))
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
        this.emotes.push("❌"); // cross
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
                       this.watchRoster(dbMessage.guild, dbRoster);
                       this.watchMessage(dbMessage, dbRoster);
                    })));
    }    

    private syncToTS3(roster: Roster): void {       
        const cl = this.getBotgartClient();
        // users are stored as <@123123123123>. Resolve if possible.
        const resolveUser = sid => {
            const idregxp = /<@(\d+)>/;
            const match = idregxp.exec(sid);
            let user = sid;
            if(match != null) {
                const resolved: discord.GuildMember = Util.resolveDiscordUser(cl, match[1])
                if(resolved != null) {
                    user = resolved.displayName;
                }
            }
            return user;
        } 

        cl.getTS3Connection().post("resetroster", {
            "date": dateFormat.default(Util.getResetDay(roster.weekNumber, roster.year), "dd.mm.yy"),
            "rbl": Array.from(roster.getMapLeaders(WvWMap.RedBorderlands)).map(resolveUser),
            "gbl": Array.from(roster.getMapLeaders(WvWMap.GreenBorderlands)).map(resolveUser),
            "bbl": Array.from(roster.getMapLeaders(WvWMap.BlueBorderlands)).map(resolveUser),
            "ebg": Array.from(roster.getMapLeaders(WvWMap.EternalBattlegrounds)).map(resolveUser)
        });
    }

    private watchRoster(guild: discord.Guild, roster: Roster): void {
        const cl = this.getBotgartClient();
        const [_, message, __] = cl.getRoster(guild, roster.weekNumber, roster.year);
        const refresh = (r: Roster, map: string, p: string) => {
            setTimeout(function() { 
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
    }

    private watchMessage(message: discord.Message, roster: Roster): void {
        Util.log("debug", "Now watching message {0} as roster for week {1}.".formatUnicorn(message.url, roster.weekNumber));
        message.createReactionCollector(e => 
            this.emotes.includes(e.emoji.name) , {}).on("collect", (r) => {
                const m = WvWMap.getMapByEmote(r.emoji.name);
                r.users.cache.filter(u => u.id !== this.client.user.id).map(u => { // reactions coming from anyone but the bot
                    if(!m) {
                        // no map has been found -> X -> user wants to remove themselves from roster
                        roster.removeLead(undefined, Util.formatUserPing(u.id));
                    } else {
                        roster.addLead(m, Util.formatUserPing(u.id));
                    }
                    r.users.remove(u);
                });
            });
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const currentWeek = Util.getNumberOfWeek();
        const rosterWeek = !args.weekNumber || args.weekNumber < currentWeek ? currentWeek : args.weekNumber;
        const rosterYear = !args.year ? new Date().getFullYear() : args.year;
        this.getBotgartClient().rosterRepository.getRosterPost(guild, rosterWeek, rosterYear).then(([dbRoster, dbChannel, dbMessage]) => {
            if(dbRoster === undefined) {
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
                // there is already a roster-post for this guild+week -> do nothing, log warning
                Util.log("warning", `Tried to initialise roster-post for calendar week ${rosterWeek} for guild '${guild.name}' in channel '${args.channel.name}'. But there is already such a post in channel '${dbChannel.name}'`);
                this.reply(message, responsible, L.get("ROSTER_EXISTS", [dbMessage.url]));
            }
        });
    }

    serialiseArgs(args) {
        let clone = Object.assign({}, args);
        clone.channel = {guild: args.channel.guild.id, channel: args.channel.id};
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        let args = JSON.parse(jsonargs);
        let guild = this.client.guilds.cache.find(g => g.id == args.channel.guild);
        args.channel = guild.channels.cache.find(c => c.id == args.channel.channel);
        return args;
    }
}

module.exports = ResetRoster;
exports.Roster = Roster;
module.exports.Roster = Roster;
module.exports.WvWMap = WvWMap;
