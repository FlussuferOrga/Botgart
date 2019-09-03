import { AkairoClient } from "discord-akairo";
import { BotgartCommand } from "./BotgartCommand.js";
import { Database } from "./DB.js";
import * as discord from "discord.js";
import { log } from "./Util.js";

export class BotgartClient extends AkairoClient {
    public db: Database;
    public cronjobs: Object;

    constructor(options, dbfile) {
        super(options, {});
        this.db = new Database(dbfile, this);  
        this.cronjobs = {};
        this.on("ready", () => {
            this.commandHandler.modules.forEach(m => {
                if(m instanceof BotgartCommand) {
                    (<BotgartCommand>m).init(this);
                }
            });
        })
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
    * @param disposable (optional, default: true) - if no channel can be found to log the message, it will be written to the debug-log as fallback. 
    */
    discordLog(guild: discord.Guild, type: string, message: string, disposable: boolean = true) {
        const channels = this.db.getLogChannels(guild, type);
        if(channels.length === 0 && disposable === false) {
            log("debug", "BotgartClient.js", "Expected channel for type '{0}' for not found in guild '{1}' to discord-log message: '{2}'.".formatUnicorn(type, guild.name, message));
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