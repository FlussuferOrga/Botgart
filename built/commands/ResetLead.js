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
const Util = __importStar(require("../Util"));
const L = __importStar(require("../Locale"));
const discord = __importStar(require("discord.js"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:

*/
class WvWMap {
    constructor(emote, name) {
        this.emote = emote;
        this.name = name;
        this.resetLeads = new Set();
    }
    static getMaps() {
        return [WvWMap.RedBorderlands, WvWMap.BlueBorderlands, WvWMap.GreenBorderlands, WvWMap.EternalBattlegrounds];
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
class Roster {
    constructor(weekNumber) {
        this.weekNumber = weekNumber;
        this.leads = {};
        for (const m of WvWMap.getMaps()) {
            this.leads[m.name] = m;
        }
    }
    getLeaders() {
        const leaders = [];
        for (const m of WvWMap.getMaps()) {
            for (const l of this.leads[m.name].resetLeads) {
                leaders.push([m.name, l]);
            }
        }
        return leaders;
    }
    addLead(map, player) {
        this.leads[map.name].resetLeads.add(player);
    }
    removeLead(map, player) {
        if (map === undefined) {
            for (const m in this.leads) {
                this.leads[m].resetLeads.delete(player);
            }
        }
        else {
            this.leads[map.name].resetLeads.delete(player);
        }
    }
    toRichEmbed() {
        const re = new discord.RichEmbed()
            .setColor("#ff0000")
            .setAuthor("Reset Commander Roster")
            .setTitle(`${L.get("WEEK_NUMBER", [], " | ", false)} ${this.weekNumber}`)
            .setDescription(L.get("RESETLEAD_HEADER"));
        for (const mname in this.leads) {
            const m = this.leads[mname];
            re.addField("{0} {1}".formatUnicorn(m.emote, m.getLocalisedName(" | ", false)), m.resetLeads.size === 0 ? "-" : Array.from(m.resetLeads).join(", "))
                .addBlankField();
        }
        return re;
    }
}
exports.Roster = Roster;
class ResetLeadCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("resetlead", {
            aliases: ["resetlead"],
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
    }
    desc() {
        return L.get("DESC_RESETLEAD");
    }
    checkArgs(args) {
        return !args || !args.channel || !(args.channel instanceof discord.TextChannel) ? L.get("HELPTEXT_RESETLEAD") : undefined;
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
                    const cancel = "❌"; // cross
                    const emotes = WvWMap.getMaps().map(m => m.emote);
                    emotes.push(cancel);
                    for (const e of emotes) {
                        yield mes.react(e);
                    }
                    this.getBotgartClient().db.addRosterPost(message.guild, roster, mes); // initial save
                    const col = mes.createReactionCollector(e => emotes.includes(e.emoji.name), {});
                    col.on("collect", (r) => {
                        const m = WvWMap.getMapByEmote(r.emoji.name);
                        r.users.filter(u => u.id !== this.client.user.id).map(u => {
                            if (!m) {
                                // no map has been found -> X -> user wants to remove themselves from roster
                                roster.removeLead(undefined, u.username);
                            }
                            else {
                                roster.addLead(m, u.username);
                            }
                            r.remove(u);
                        });
                        mes.edit(roster.toRichEmbed());
                        this.getBotgartClient().db.addRosterPost(message.guild, roster, mes); // save whenever someone reacts
                    });
                }));
            }
            else {
                // there is already a roster-post for this guild+week -> do nothing, log warning
                Util.log("warning", "ResetLead.js", `Tried to initialise roster-post for calendar week ${rosterWeek} for guild '${guild.name}' in channel '${args.channel.name}'. But there is already such a post in channel '${dbChannel.name}'`);
            }
        });
    }
}
exports.ResetLeadCommand = ResetLeadCommand;
module.exports = ResetLeadCommand;
exports.Roster = Roster;
module.exports.Roster = Roster;
module.exports.WvWMap = WvWMap;
