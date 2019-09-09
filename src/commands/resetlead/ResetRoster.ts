let config = require.main.require("../config.json");
import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import EventEmitter = require("events");


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

    public constructor(weekNumber: number) {
        super();
        this.weekNumber = weekNumber;
        this.leads = {};
        for(const m of WvWMap.getMaps()) {
            this.leads[m.name] = [m, new Set<string>()];
        }
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
    private messages: {[key: string]: Roster};
    private emotes: string[];

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
                       client.setRoster(dbRoster.weekNumber, dbChannel.guild, dbMessage, dbRoster);
                       this.watchRoster(dbRoster);
                       this.watchMessage(dbMessage, dbRoster);
                    })));
    }    

    private watchRoster(roster: Roster): void {
        const cl = this.getBotgartClient();
        const [guild, message, _] = cl.getRoster(roster.weekNumber);
        const refresh = (r: Roster, map: string, p: string) => {
            cl.db.upsertRosterPost(guild, r, message);
            message.edit(r.toRichEmbed());
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
        this.getBotgartClient().db.getRosterPost(guild, rosterWeek).then(([dbRoster, dbChannel, dbMessage]) => {
            if(dbRoster === undefined) {
                // no roster for this guild+week -> create one
                const roster = new Roster(rosterWeek);
                (<discord.TextChannel>args.channel).send(roster.toRichEmbed())
                .then(async (mes: discord.Message) => {
                    for(const e of this.emotes) {
                        await mes.react(e);
                    }
                    this.getBotgartClient().setRoster(roster.weekNumber, mes.guild, mes, roster);
                    this.getBotgartClient().db.upsertRosterPost(message.guild, roster, mes); // initial save
                    this.watchMessage(mes, roster);
                    this.watchRoster(roster);
                });
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