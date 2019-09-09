"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const Util = __importStar(require("../../Util"));
const L = __importStar(require("../../Locale"));
const discord = __importStar(require("discord.js"));
const BotgartCommand_1 = require("../../BotgartCommand");
const EventEmitter = require("events");
/**
Testcases:

*/
class WvWMap {
    constructor(emote, name) {
        this.emote = emote;
        this.name = name;
    }
    static getMaps() {
        return [WvWMap.RedBorderlands, WvWMap.BlueBorderlands, WvWMap.GreenBorderlands, WvWMap.EternalBattlegrounds];
    }
    static getMapNames() {
        return WvWMap.getMaps().map(m => m.name);
    }
    static getMapByEmote(emote) {
        return WvWMap.getMaps().filter(m => m.emote === emote)[0]; // yields undefined if no match
    }
    static getMapByName(name) {
        return WvWMap.getMaps().filter(m => m.name === name)[0]; // yields undefined if no match
    }
    getLocalisedName(separator = "\n", flags = true) {
        return L.get(this.name, [], separator, flags);
    }
}
exports.WvWMap = WvWMap;
WvWMap.RedBorderlands = new WvWMap("📕", "RED_BORDERLANDS");
WvWMap.BlueBorderlands = new WvWMap("📘", "BLUE_BORDERLANDS");
WvWMap.GreenBorderlands = new WvWMap("📗", "GREEN_BORDERLANDS");
WvWMap.EternalBattlegrounds = new WvWMap("📙", "ETERNAL_BATTLEGROUNDS");
class Roster extends EventEmitter {
    constructor(weekNumber) {
        super();
        this.weekNumber = weekNumber;
        this.leads = {};
        for (const m of WvWMap.getMaps()) {
            this.leads[m.name] = [m, new Set()];
        }
    }
    getLeaders() {
        const leaders = [];
        for (const m of WvWMap.getMaps()) {
            const [wvwmap, leads] = this.leads[m.name];
            for (const l of leads) {
                leaders.push([m.name, l]);
            }
        }
        return leaders;
    }
    addLead(map, player) {
        if (map && map.name in this.leads) {
            this.leads[map.name][1].add(player);
            this.emit("addleader", this, map, player);
        }
    }
    removeLead(map, player) {
        if (map === undefined) {
            for (const m in this.leads) {
                this.leads[m][1].delete(player);
                this.emit("removeleader", this, m, player);
            }
        }
        else {
            this.leads[map.name][1].delete(player);
            this.emit("removeleader", this, map, player);
        }
    }
    emptyMaps() {
        return Object.keys(this.leads).filter(k => this.leads[k][1].size === 0).map(k => this.leads[k][0]);
    }
    emptyMapCount() {
        return this.emptyMaps().length;
    }
    getEmbedColour() {
        return ["#00ff00", "#cef542", "#f5dd42", "#f58442", "#ff0000"][this.emptyMapCount()];
    }
    toRichEmbed() {
        const re = new discord.RichEmbed()
            .setColor(this.getEmbedColour())
            .setAuthor("Reset Commander Roster")
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber}`)
            .setDescription(L.get("RESETLEAD_HEADER"));
        for (const mname in this.leads) {
            const [wvwmap, leads] = this.leads[mname];
            re.addField("{0} {1}".formatUnicorn(wvwmap.emote, wvwmap.getLocalisedName(" | ", false)), leads.size === 0 ? "-" : Array.from(leads).join(", "))
                .addBlankField();
        }
        return re;
    }
}
exports.Roster = Roster;
class ResetRosterCommand extends BotgartCommand_1.BotgartCommand {
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
        }, false, // available per DM
        true // cronable
        );
        this.messages = {};
        this.emotes = WvWMap.getMaps().map(m => m.emote);
        this.emotes.push("❌"); // cross
    }
    desc() {
        return L.get("DESC_RESETLEAD");
    }
    checkArgs(args) {
        return !args || !args.channel || !(args.channel instanceof discord.TextChannel) ? L.get("HELPTEXT_RESETLEAD") : undefined;
    }
    init(client) {
        client.guilds.forEach(g => Promise.all(client.db.getActiveRosters(g))
            .then(ars => ars.filter(([dbRoster, _, __]) => dbRoster !== undefined)
            .forEach(([dbRoster, dbChannel, dbMessage]) => {
            client.setRoster(dbRoster.weekNumber, dbChannel.guild, dbMessage, dbRoster);
            this.watchRoster(dbRoster);
            this.watchMessage(dbMessage, dbRoster);
        })));
    }
    watchRoster(roster) {
        const cl = this.getBotgartClient();
        const [guild, message, _] = cl.getRoster(roster.weekNumber);
        const refresh = (r, map, p) => {
            cl.db.upsertRosterPost(guild, r, message);
            message.edit(r.toRichEmbed());
        };
        roster.on("addleader", refresh);
        roster.on("removeleader", refresh);
    }
    watchMessage(message, roster) {
        Util.log("debug", "ResetRoster.js", "Now watching message {0} as roster for week {1}.".formatUnicorn(message.url, roster.weekNumber));
        message.createReactionCollector(e => this.emotes.includes(e.emoji.name), {}).on("collect", (r) => {
            const m = WvWMap.getMapByEmote(r.emoji.name);
            r.users.filter(u => u.id !== this.client.user.id).map(u => {
                if (!m) {
                    // no map has been found -> X -> user wants to remove themselves from roster
                    roster.removeLead(undefined, Util.formatUserPing(u.id));
                }
                else {
                    roster.addLead(m, Util.formatUserPing(u.id));
                }
                r.remove(u);
            });
        });
    }
    command(message, responsible, guild, args) {
        const currentWeek = Util.getNumberOfWeek();
        const rosterWeek = !args.weekNumber || args.weekNumber < currentWeek ? currentWeek : args.weekNumber;
        this.getBotgartClient().db.getRosterPost(guild, rosterWeek).then(([dbRoster, dbChannel, dbMessage]) => {
            if (dbRoster === undefined) {
                // no roster for this guild+week -> create one
                const roster = new Roster(rosterWeek);
                args.channel.send(roster.toRichEmbed())
                    .then((mes) => __awaiter(this, void 0, void 0, function* () {
                    for (const e of this.emotes) {
                        yield mes.react(e);
                    }
                    this.getBotgartClient().setRoster(roster.weekNumber, mes.guild, mes, roster);
                    this.getBotgartClient().db.upsertRosterPost(message.guild, roster, mes); // initial save
                    this.watchMessage(mes, roster);
                    this.watchRoster(roster);
                }));
            }
            else {
                // there is already a roster-post for this guild+week -> do nothing, log warning
                Util.log("warning", "ResetLead.js", `Tried to initialise roster-post for calendar week ${rosterWeek} for guild '${guild.name}' in channel '${args.channel.name}'. But there is already such a post in channel '${dbChannel.name}'`);
                this.reply(message, responsible, L.get("ROSTER_EXISTS", [dbMessage.url]));
            }
        });
    }
}
exports.ResetRosterCommand = ResetRosterCommand;
module.exports = ResetRosterCommand;
exports.Roster = Roster;
module.exports.Roster = Roster;
module.exports.WvWMap = WvWMap;
