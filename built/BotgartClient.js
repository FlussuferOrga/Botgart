"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
const BotgartCommand_js_1 = require("./BotgartCommand.js");
const DB_js_1 = require("./DB.js");
const discord = __importStar(require("discord.js"));
const Util_js_1 = require("./Util.js");
class BotgartClient extends discord_akairo_1.AkairoClient {
    constructor(options, dbfile) {
        super(options, {});
        this.db = new DB_js_1.Database(dbfile, this);
        this.cronjobs = {};
        this.rosters = {};
        this.on("ready", () => {
            this.commandHandler.modules.forEach(m => {
                if (m instanceof BotgartCommand_js_1.BotgartCommand) {
                    m.init(this);
                }
            });
        });
    }
    getRoster(weekNumber) {
        return weekNumber in this.rosters ? this.rosters[weekNumber] : [undefined, undefined, undefined];
    }
    setRoster(weekNumber, guild, message, roster) {
        this.rosters[weekNumber] = [guild, message, roster];
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
    discordLog(guild, type, message, disposable = true) {
        const channels = this.db.getLogChannels(guild, type);
        if (channels.length === 0 && disposable === false) {
            Util_js_1.log("debug", "BotgartClient.js", "Expected channel for type '{0}' for not found in guild '{1}' to discord-log message: '{2}'.".formatUnicorn(type, guild.name, message));
        }
        else {
            channels.forEach(cid => {
                const channel = guild.channels.find(c => c.id === cid);
                if (!channel) {
                    Util_js_1.log("error", "BotgartClient.js", "Channel for type '{0}' for guild '{1}' is set to channel '{2}'' in the DB, but no longer present in the guild. Skipping.".formatUnicorn(type, guild.name, cid));
                }
                else if (!(channel instanceof discord.TextChannel)) {
                    Util_js_1.log("error", "BotgartClient.js", "Channel '{0}' in guild '{1}' to log type '{2}' was found, but appears to be a voice channel. Skipping.".formatUnicorn(cid, guild.name, type));
                }
                else {
                    channel.send(message);
                }
            });
        }
    }
}
exports.BotgartClient = BotgartClient;
