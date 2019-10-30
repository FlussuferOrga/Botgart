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
const TS3Connection = require("../TS3Connection");
const ts3c = __importStar(require("../TS3Connection"));
const gw2 = require("gw2api-client");
const api = gw2();
/*
*********************************************************************************
                 tag up
    +---------------------------------+
    |                                 v
+---+---+   +--------+  delay     +---+--+
|unknown|   |COOLDOWN+----------->+TAG_UP|
+-------+   +-----+--+            +---+--+
                  ^                   | grace period
           tag up |                   v
            +-----+--+            +---+-----+
            |TAG_DOWN+<-----------+COMMANDER|
            +--------+  tag down  +---------+


Note that there is also an uncovered case:
the transition from anywhere to TAG_DOWN only happens, if
the user tags down when they are already in COMMANDER state.
That means having a user tag down while in COOLDOWN or TAG_UP
places them in a bit of a limbo state, resulting in them staying on
the exact state where they have left off. This is not an actial problem.
The "worst case" here could be the following:

imagine the delay being set to 30 minutes.
Now, an active player P commands for a while,
tags down and up again, playing P in COOLDOWN.
They then tag down immediately and play tagless for two hours.
Then, they decide to tag up again, resuming in COOLDOWN.
But since their last known timestep is two hours old, they will leave that
state immediately on the next tag to become TAG_UP.
*********************************************************************************
*/
var CommanderState;
(function (CommanderState) {
    CommanderState[CommanderState["COOLDOWN"] = 0] = "COOLDOWN";
    CommanderState[CommanderState["TAG_UP"] = 1] = "TAG_UP";
    CommanderState[CommanderState["COMMANDER"] = 2] = "COMMANDER";
    CommanderState[CommanderState["TAG_DOWN"] = 3] = "TAG_DOWN";
})(CommanderState || (CommanderState = {}));
class TS3Listener extends discord_akairo_1.Listener {
    constructor() {
        super("ts3listener", {
            emitter: "client",
            eventName: "ready"
        });
        this.ts3connection = new ts3c.TS3Connection(config.ts_listener.ip, config.ts_listener.port);
        this.broadcastChannel = config.ts_listener.broadcast_channel;
        this.pingRole = config.ts_listener.ping_role;
        this.commanderRole = config.ts_listener.commander_role;
        this.userDelay = config.ts_listener.user_delay;
        this.channelDelay = config.ts_listener.channel_delay;
        this.gracePeriod = config.ts_listener.grace_period;
        this.activeCommanders = {};
        this.users = {};
        this.channels = {};
        const that = this;
        this.ts3connection.getSocket().on("data", (raw) => {
            const data = JSON.parse(raw.toString());
            Util_1.log("debug", "TS3Listener.js", "Received from TS-Bot: {0}".formatUnicorn(JSON.stringify(data)));
            const now = new Date();
            const taggedDown = Util_1.setMinus(Object.keys(that.activeCommanders), new Set(data.commanders.map(c => c.ts_cluid)));
            that.client.guilds.forEach(g => {
                data.commanders.forEach(c => {
                    let account = c.account_name; // for lookup
                    let uid = c.ts_cluid; // for this.users
                    let username = c.ts_display_name; // for broadcast
                    let channel = c.ts_channel_name; // for broadcast and this.channels
                    if (!(uid in that.users)) {
                        // user was newly discovered as tagged up -> save user without cooldown
                        that.users[uid] = [now, CommanderState.TAG_UP];
                        Util_1.log("debug", "TS3Listener.js", "Moving newly discovered {0} to TAG_UP state.".formatUnicorn(username));
                    }
                    let [userLastTime, state] = that.users[uid];
                    switch (state) {
                        case CommanderState.TAG_UP:
                            // user tagged up and is waiting to gain commander status
                            if (now.getTime() - userLastTime.getTime() > that.gracePeriod) {
                                that.users[uid] = [now, CommanderState.COMMANDER];
                                that.tagUp(g, account, uid, username, channel);
                                Util_1.log("debug", "TS3Listener.js", "Moving {0} from TAG_UP to COMMANDER state.".formatUnicorn(username));
                            }
                            break;
                        case CommanderState.COOLDOWN:
                            // user tagged up again too quickly -> wait out delay and then go into TAG_UP
                            if (now.getTime() - userLastTime.getTime() > that.userDelay) {
                                that.users[uid] = [now, CommanderState.TAG_UP];
                                Util_1.log("debug", "TS3Listener.js", "Moving {0} from COOLDOWN to TAG_UP state.".formatUnicorn(username));
                            }
                            break;
                        case CommanderState.TAG_DOWN:
                            // user raided before, but tagged down in between
                            // -> if they waited long enough, go into TAG_UP, else sit out COOLDOWN
                            if (now.getTime() - userLastTime.getTime() > that.userDelay) {
                                that.users[uid] = [now, CommanderState.TAG_UP];
                                Util_1.log("debug", "TS3Listener.js", "Moving {0} from TAG_DOWN to TAG_UP state.".formatUnicorn(username));
                            }
                            else {
                                that.users[uid] = [userLastTime, CommanderState.COOLDOWN];
                                Util_1.log("debug", "TS3Listener.js", "Moving {0} from TAG_DOWN to COOLDOWN state.".formatUnicorn(username));
                            }
                            break;
                        case CommanderState.COMMANDER:
                            // still raiding -> update timestamp
                            that.users[uid] = [now, state];
                            break;
                    }
                });
                taggedDown.forEach(tduid => {
                    that.users[tduid] = [now, CommanderState.TAG_DOWN];
                    that.tagDown(g, tduid, that.activeCommanders[tduid]);
                    Util_1.log("debug", "TS3Listener.js", "Moving {0} from COOLDOWN, TAG_UP, or COMMANDER to TAG_DOWN state.".formatUnicorn(tduid));
                });
            });
            //client.destroy(); // kill client after server's response
        });
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
        this.activeCommanders[tsUID] = account;
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
                Util_1.log("info", "TS3Listener.js", "Tagging down {0} in {1}.".formatUnicorn(duser.displayName, g.name));
                duser.removeRole(crole).catch(e => {
                    Util_1.log("warning", "TS3Listener.js", "Could not remove role '{0}' from user '{1}'' which was expected to be there. Maybe someone else already removed it.".formatUnicorn(this.commanderRole, duser.nickname));
                });
            }
        }
        delete this.activeCommanders[tsUID];
    }
    exec() {
    }
}
exports.TS3Listener = TS3Listener;
module.exports = TS3Listener;
