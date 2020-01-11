const config = require("../config.json")
import { AkairoClient } from "discord-akairo"
import { BotgartCommand } from "./BotgartCommand.js"
import { Database } from "./DB.js"
import * as discord from "discord.js"
import { log, loadModuleClasses } from "./Util.js"
import { Roster } from "./commands/resetlead/ResetRoster"
import { TS3Connection, TS3Listener } from "./TS3Connection"
import { APIEmitter } from "./emitters/APIEmitter"
import * as Util from "./Util";
import * as moment from "moment";
import * as achievements from "./commands/achievements/Achievements";

export class BotgartClient extends AkairoClient {
    public db: Database;
    public cronjobs: Object;
    private ts3connection : TS3Connection;
    private rosters: {[key: string] : [discord.Guild, discord.Message, Roster]};
    public readonly gw2apiemitter: APIEmitter;
    public readonly ts3listener: TS3Listener;
    private achievements: {[key:string] : achievements.Achievement};

    constructor(options, dbfile) {
        super(options, {});
        this.db = new Database(dbfile, this);
        this.cronjobs = {};
        this.rosters = {};
        this.achievements = {};
        this.gw2apiemitter = new APIEmitter();
        this.ts3listener = new TS3Listener(this);
        this.ts3connection = new TS3Connection(config.ts_listener.ip, config.ts_listener.port, "MainConnection");
        this.ts3connection.exec();
        
        this.on("ready", () => {
            this.commandHandler.modules.forEach(m => {
                if(m instanceof BotgartCommand) {
                    (<BotgartCommand>m).init(this);
                }
            });
        });

        this.gw2apiemitter.on("wvw-matches", (prom) => {
            prom.then(async stats => {
                if(stats === undefined) return;
                const matchId = await Util.getCurrentMatchId(this.db);
                const snapshotId = this.db.addStatsSnapshot();
                for await(const mapData of stats.maps) {
                    for(const faction in mapData.scores) { // keys of the dict, aka red, blue, green
                        this.db.addMatchupStats(
                                    matchId, 
                                    snapshotId, 
                                    mapData.type, // map 
                                    Util.capitalise(faction), // keys are lowercase, DB constraint is capitalised
                                    mapData.deaths[faction], 
                                    mapData.kills[faction],
                                    mapData.scores[faction])
                    }
                    
                }

            });
        });

        this.gw2apiemitter.on("wvw-matches", (prom) => {
            prom.then(async match => {
                if(match === undefined) return;
                const matchId = await Util.getCurrentMatchId(this.db);
                const snapshotId = this.db.addObjectivesSnapshot();
                const objs = match.maps
                            .reduce((acc, m) => acc.concat(m.objectives.map(obj => [m.type, obj])), []) // put objectives from all maps into one array
                            .filter(([m, obj]) => obj.type !== "Spawn") // remove spawn - not interesting
                            .map(([m, obj]) => [m, obj, Util.determineTier(obj.yaks_delivered)]); // add tier information
                this.db.addMatchupObjectives(matchId, snapshotId, objs);
            })
        });

        Util.loadModuleClasses("built/commands/achievements/Achievements.js", [this], ["Achievement"]).forEach(achievement => {
            if(achievement instanceof achievements.Achievement) {
                this.registerAchievement(achievement);
                Util.log("info", "Botgart.js", `Registered achievement '${achievement.name}'.`);
            }            
        });
    }

    public getAchievements(): achievements.Achievement[] {
        return Object.values(this.achievements);
    }

    public getAchievement(name: string): achievements.Achievement {
        name = name.toLowerCase();
        return name in this.achievements ? this.achievements[name] : undefined;
    }

    public registerAchievement(achievement: achievements.Achievement) {
        this.achievements[achievement.name.toLowerCase()] = achievement;
    }

    private toRosterKey(guild: discord.Guild, weekNumber: number, year: number): string {
        return `${guild.id}|${year}|${weekNumber}`;
    }

    public getTS3Connection() : TS3Connection {
        return this.ts3connection;
    }

    public getRoster(guild: discord.Guild, weekNumber: number, year: number): [discord.Guild, discord.Message, Roster] | [undefined, undefined, undefined] {
        const k = this.toRosterKey(guild, weekNumber, year);
        return k in this.rosters ? this.rosters[k] : [undefined, undefined, undefined];
    }

    public setRoster(weekNumber: number, year: number, guild: discord.Guild, message: discord.Message, roster: Roster): void {
        this.rosters[this.toRosterKey(guild, weekNumber, year)] = [guild, message, roster];
    }

    /**
    * Logs a string to a Discord-text-channel. For each type, one or more channels
    * can be set. Types are arbitrary strings, making this feature far more
    * flexible than just log levels. In fact, it enables us to have each command
    * define an own "type" and have administrators define channels to which messages
    * of that type are being written to. 
    * E.g. a ClockCommand could call
    *   discordLog(_, "clock", now())
    * every minute and define a connection between the "clock"-type and the channel #time in a guild.
    * That would cause now() to be written to #time every minute.
    * @param guild - guild for which the connection should be defined
    * @param type - arbitrary type
    * @param message - the message to log 
    * @param disposable (optional, default: true) - if FALSE and no channel can be found to log the message, it will be written to the debug-log as fallback. 
    */
    public discordLog(guild: discord.Guild, type: string, message: string, disposable: boolean = true) {
        const channels = this.db.getLogChannels(guild, type);
        if(channels.length === 0 && disposable === false) {
            log("debug", "BotgartClient.js", "Expected channel for type '{0}' was not found in guild '{1}' to discord-log message: '{2}'.".formatUnicorn(type, guild.name, message));
        } else {
            channels.forEach(cid => {
            const channel: discord.GuildChannel = guild.channels.find(c => c.id === cid);
            if(!channel) {
                log("error", "BotgartClient.js", "Channel for type '{0}' for guild '{1}' is set to channel '{2}'' in the DB, but no longer present in the guild. Skipping.".formatUnicorn(type, guild.name, cid));
            } else if(!(channel instanceof discord.TextChannel)) {
                log("error", "BotgartClient.js", "Channel '{0}' in guild '{1}' to log type '{2}' was found, but appears to be a voice channel. Skipping.".formatUnicorn(cid, guild.name, type));
            } else {
                (<discord.TextChannel>channel).send(message);
            }
        });    
        }
    }
}