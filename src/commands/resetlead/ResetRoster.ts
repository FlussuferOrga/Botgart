import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import EventEmitter = require("events");
import * as dateFormat from "dateformat";

/**
Testcases:

*/
export class WvWMap {
    static readonly RedBorderlands = new WvWMap("📕", "RED_BORDERLANDS");
    static readonly BlueBorderlands = new WvWMap("📘", "BLUE_BORDERLANDS");
    static readonly GreenBorderlands = new WvWMap("📗", "GREEN_BORDERLANDS");
    static readonly EternalBattlegrounds = new WvWMap("📙", "ETERNAL_BATTLEGROUNDS");

    static getMaps(): WvWMap[] {
        return [WvWMap.RedBorderlands, WvWMap.BlueBorderlands, WvWMap.GreenBorderlands, WvWMap.EternalBattlegrounds];
    }

    static getMapNames(): string[] {
        return WvWMap.getMaps().map(m => m.name);
    }

    static getMapByEmote(emote: string): WvWMap {
        return WvWMap.getMaps().filter(m => m.emote === emote)[0] // yields undefined if no match
    }

    static getMapByName(name: string): WvWMap {
        return WvWMap.getMaps().filter(m => m.name === name)[0] // yields undefined if no match
    }

    public readonly emote: string;
    public readonly name: string;

    public getLocalisedName(separator = "\n", flags = true): string {
        return L.get(this.name, [], separator, flags);
    }

    private constructor(emote: string, name: string) {
        this.emote = emote;
        this.name = name;
    }
}

export class Roster extends EventEmitter {
    public readonly leads: {[key: string] : [WvWMap, Set<string>]};
    public readonly weekNumber: number;
    public readonly year: number;

    public static getNextResetDate(now = new Date()): Date {
        const resetDay = Util.getResetDay(Util.getNumberOfWeek(now), now.getFullYear());
        const nowWeekDay = (now.getDay() + 6)%7; // makes SUN 6
        const resetWeekDay = (Util.RESET_WEEKDAY + 6)%7;
        if(nowWeekDay > resetWeekDay) {
            resetDay.setDate(resetDay.getDate() + 7);
        }
        return resetDay;
    }

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
        return Util.compareDatesWithoutTime(this.getResetDate(), Roster.getNextResetDate());
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

    public toRichEmbed(): discord.RichEmbed {
        const re = new discord.RichEmbed()
            .setColor(this.getEmbedColour())
            .setAuthor("Reset Commander Roster")
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber}`)
            //.setThumbnail("https://wiki.guildwars2.com/images/5/54/Commander_tag_%28blue%29.png")
            .setDescription(L.get("RESETLEAD_HEADER"))
        for(const mname in this.leads) {
            const [wvwmap, leads] = this.leads[mname];
            re.addField("{0} {1}".formatUnicorn(wvwmap.emote, wvwmap.getLocalisedName(" | ", false)), leads.size === 0 ? "-" : Array.from(leads).join(", "))
              .addBlankField();
        }
        return re;
    }
}

export class ResetRosterCommand extends BotgartCommand {
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
        false,  // available per DM
        true // cronable
        );
        this.messages = {};
        this.emotes = WvWMap.getMaps().map(m => m.emote);
        this.emotes.push("❌"); // cross
        this.syncScheduled = false;
    }

    desc(): string {
        return L.get("DESC_RESETLEAD");
    }

    checkArgs(args) {
        return !args || !args.channel || !(args.channel instanceof discord.TextChannel) ? L.get("HELPTEXT_RESETLEAD") : undefined;
    }

    public init(client: BotgartClient): void {
        client.guilds.forEach(
            g => Promise.all(client.db.getActiveRosters(g))
                .then(ars => ars.filter(([dbRoster, _, __]) => dbRoster !== undefined)
                   .forEach(([dbRoster, dbChannel, dbMessage]) => {
                       client.setRoster(dbRoster.weekNumber, dbRoster.year, dbChannel.guild, dbMessage, dbRoster);
                       this.watchRoster(dbRoster);
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

        const ts3mes = {}
        ts3mes["type"] = "post";
        ts3mes["command"] = "setresetroster";
        ts3mes["args"] = {
            "date": dateFormat.default(Util.getResetDay(roster.weekNumber, roster.year), "dd.mm.yy"),
            "rbl": Array.from(roster.getMapLeaders(WvWMap.RedBorderlands)).map(resolveUser),
            "gbl": Array.from(roster.getMapLeaders(WvWMap.GreenBorderlands)).map(resolveUser),
            "bbl": Array.from(roster.getMapLeaders(WvWMap.BlueBorderlands)).map(resolveUser),
            "ebg": Array.from(roster.getMapLeaders(WvWMap.EternalBattlegrounds)).map(resolveUser)
        };
        cl.getTS3Connection().write(JSON.stringify(ts3mes));       
    }

    private watchRoster(roster: Roster): void {
        const cl = this.getBotgartClient();
        const [guild, message, _] = cl.getRoster(roster.weekNumber, roster.year);
        const refresh = (r: Roster, map: string, p: string) => {
            setTimeout(function() { 
                // only updating post, DB, and TS3 in fixed intervals
                // reduces strain if people are being funny by clicking around wildly
                // and only updates once if someone who was tagged for multiple maps 
                // pulls back, instead for once for every map.
                if(this.syncScheduled) return;
                this.syncScheduled = true;
                cl.db.upsertRosterPost(guild, r, message);
                message.edit(r.toRichEmbed());

                if(roster.isUpcoming()) {
                    this.syncToTS3(roster);
                }
                this.syncScheduled = false;
            }.bind(this), ResetRosterCommand.UPDATE_DELAY);
        };
        roster.on("addleader", refresh);
        roster.on("removeleader", refresh);
    }

    private watchMessage(message: discord.Message, roster: Roster): void {
        Util.log("debug", "ResetRoster.js", "Now watching message {0} as roster for week {1}.".formatUnicorn(message.url, roster.weekNumber));
        message.createReactionCollector(e => 
            this.emotes.includes(e.emoji.name) , {}).on("collect", (r) => {
                const m = WvWMap.getMapByEmote(r.emoji.name);
                r.users.filter(u => u.id !== this.client.user.id).map(u => { // reactions coming from anyone but the bot
                    if(!m) {
                        // no map has been found -> X -> user wants to remove themselves from roster
                        roster.removeLead(undefined, Util.formatUserPing(u.id));
                    } else {
                        roster.addLead(m, Util.formatUserPing(u.id));
                    }
                    r.remove(u);
                });
            });
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const currentWeek = Util.getNumberOfWeek();
        const rosterWeek = !args.weekNumber || args.weekNumber < currentWeek ? currentWeek : args.weekNumber;
        const rosterYear = !args.year ? new Date().getFullYear() : args.year;
        this.getBotgartClient().db.getRosterPost(guild, rosterWeek, rosterYear).then(([dbRoster, dbChannel, dbMessage]) => {
            if(dbRoster === undefined) {
                // no roster for this guild+week -> create one
                const roster = new Roster(rosterWeek, rosterYear);
                (<discord.TextChannel>args.channel).send(roster.toRichEmbed())
                .then(async (mes: discord.Message) => {
                    for(const e of this.emotes) {
                        await mes.react(e);
                    }
                    this.getBotgartClient().setRoster(roster.weekNumber, roster.year, mes.guild, mes, roster);
                    this.getBotgartClient().db.upsertRosterPost(message.guild, roster, mes); // initial save
                    this.watchMessage(mes, roster);
                    this.watchRoster(roster);
                });
                if(roster.isUpcoming()) {
                    this.syncToTS3(roster);
                }
            } else {
                // there is already a roster-post for this guild+week -> do nothing, log warning
                Util.log("warning", "ResetLead.js", `Tried to initialise roster-post for calendar week ${rosterWeek} for guild '${guild.name}' in channel '${args.channel.name}'. But there is already such a post in channel '${dbChannel.name}'`);
                this.reply(message, responsible, L.get("ROSTER_EXISTS", [dbMessage.url]));
            }
        });
    }
}

module.exports = ResetRosterCommand;
exports.Roster = Roster;
module.exports.Roster = Roster;
module.exports.WvWMap = WvWMap;
