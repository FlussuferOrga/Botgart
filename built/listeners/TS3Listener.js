"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const discord_akairo_1 = require("discord-akairo");
const Util_1 = require("../Util");
const L = __importStar(require("../Locale.js"));
const discord = __importStar(require("discord.js"));
const gw2 = require("gw2api-client");
const api = gw2();
const net = require("net");
class TS3Listener extends discord_akairo_1.Listener {
    constructor() {
        super("ts3listener", {
            emitter: "client",
            eventName: "ready"
        });
        this.socket = new net.Socket();
        this.ip = config.ts_listener.ip;
        this.port = config.ts_listener.port;
        this.broadcastChannel = config.ts_listener.broadcast_channel;
        this.pingRole = config.ts_listener.ping_role;
        this.commanderRole = config.ts_listener.commander_role;
        this.userDelay = config.ts_listener.user_delay;
        this.channelDelay = config.ts_listener.channel_delay;
        this.gracePeriod = config.ts_listener.grace_period;
        this.activeCommanders = {};
        this.users = {};
        this.channels = {};
    }
    /**
    * Makes a user tag up in a Discord-guild. That means:
    * - the raid is being announced in the dedicated channel (if that channel exists)
    * - if the user is not just in TS, but also in Discord, he will gain the commander status there
    * - a mapping of the TS-UID to the Discord-username is created
    */
    tagUp(g, account, tsUID, username, channel) {
        Util_1.log("info", "TS3Listener.js", "Tagging up {0} in {1}.".formatUnicorn(username, g.name));
        let registration = this.client.db.getUserByAccountName(account);
        if (registration) {
            // the commander is member of the current discord -> give role
            let crole = g.roles.find(r => r.name === this.commanderRole);
            let duser = g.members.find(m => m.id === registration.user);
            if (crole && duser) {
                duser.addRole(crole);
            }
            username = "{0} ({1})".formatUnicorn(username, registration.registration_role);
        }
        // broadcast the message                    
        let dchan = g.channels.find(c => c.name === this.broadcastChannel && c instanceof discord.TextChannel);
        if (!dchan) {
            Util_1.log("warning", "TS3Listener.js", "I was supposed to broadcast the commander message on guild '{0}' in channel '{1}', but no such channel was found there. Skipping.".formatUnicorn(g.name, this.broadcastChannel));
        }
        else {
            let pingRole = g.roles.find(r => r.name === this.pingRole);
            let mes = L.get("COMMANDER_TAG_UP", [username, channel, pingRole ? pingRole.toString() : ""]);
            dchan.send(mes);
        }
        this.activeCommanders[tsUID] = username;
    }
    /**
    * Makes the user tag down in a Discord-guild. That is:
    * - the role is removed from the user if he is present in the Discord
    * - the user's TS-UID-Discordname is forgotten
    */
    tagDown(g, tsUID, account) {
        let registration = this.client.db.getUserByAccountName(account);
        if (registration) {
            // the commander is member of the current discord -> remove role
            let crole = g.roles.find(r => r.name === this.commanderRole);
            let duser = g.members.find(m => m.id === registration.user);
            if (crole && duser) {
                Util_1.log("info", "TS3Listener.js", "Tagging down {0} in {1}.".formatUnicorn(duser.nickname, g.name));
                duser.removeRole(crole).catch(e => {
                    Util_1.log("warning", "TS3Listener.js", "Could not remove role '{0}' from user '{1}'' which was expected to be there. Maybe someone else already removed it.".formatUnicorn(this.commanderRole, duser.nickname));
                });
            }
        }
        delete this.activeCommanders[tsUID];
    }
    connect() {
        const that = this;
        this.socket.connect(that.port, that.ip, function () {
            Util_1.log("info", "TS3Listener.js", "Successfully connected to TS3-Server on {0}:{1}".formatUnicorn(that.ip, that.port));
            // client.write('Hello, server! Love, Client.');
        });
        this.socket.on("data", function (data) {
            data = JSON.parse(data);
            const now = new Date();
            console.log(data);
            const taggedDown = Util_1.setMinus(Object.keys(that.activeCommanders), new Set(data.commanders.map(c => c.ts_cluid)));
            that.client.guilds.forEach(g => {
                data.commanders.forEach(c => {
                    let account = c.account_name; // for lookup
                    let uid = c.ts_cluid; // for this.users
                    let username = c.ts_display_name; // for broadcast
                    let channel = c.ts_channel_name; // for broadcast and this.channels
                    if (!(uid in that.users)) {
                        // user was newly discovered as tagged up -> save user
                        that.users[uid] = now;
                    }
                    let userLast = that.users[uid];
                    if (uid in that.activeCommanders) {
                        // user is still tagged up -> update timestamp
                        that.users[uid] = now;
                    }
                    else {
                        // user has recently tagged up but is not marked as active commander yet -> check if his grace period is up
                        if (now.getTime() - userLast.getTime() > that.userDelay) {
                            that.tagUp(g, account, uid, username, channel);
                        }
                    }
                });
                taggedDown.forEach(tduid => {
                    that.tagDown(g, tduid, that.activeCommanders[tduid]);
                });
            });
            //client.destroy(); // kill client after server's response
        });
        this.socket.on("close", function () {
            console.log("Connection closed");
        });
    }
    exec() {
        console.log("connecting");
        try {
            this.connect();
            console.log("connected");
        }
        catch (e) {
            console.log(e);
            // pass
        }
    }
}
exports.TS3Listener = TS3Listener;
module.exports = TS3Listener;
