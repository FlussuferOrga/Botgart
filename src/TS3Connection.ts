const config = require("../config.json");
import { log, setMinus } from "./Util";
import * as net from "net";
import CircularBuffer from "circular-buffer";
import * as moment from "moment";
import * as L from "./Locale.js";
import * as discord from "discord.js";
import { BotgartClient } from "./BotgartClient";
import EventEmitter from "events"

// shouldn't be too large, or else the lockout at start (two concurrent connections connecting at the same time)
// take ages to connect upon boot.
const RECONNECT_TIMER_MS = 30000; 

export class TS3Connection {
    private static CONNECTION_COUNTER: number = 1;
    private static CIRCULAR_BUFFER_SIZE: number = 4;

    private socket: net.Socket;
    private connected: boolean;
    private ip: string;
    private port: number;
    private name: string;
    private buffer: CircularBuffer<string>;

    public getSocket(): net.Socket {
        return this.socket;
    }

    public write(message : string): boolean {
        let sent: boolean = false;
        // ERR_STREAM_DESTROYED is a system error that will not cause
        // an exception, but instead halts the process, see:
        // https://nodejs.org/api/errors.html#errors_exceptions_vs_errors
        // So we must instead try to detect destroyed pipes gracefully
        if(!this.connected || this.socket.destroyed) { 
            this.buffer.enq(message);
        } else {
            try {
                this.socket.write(message);    
                sent = true;
            } catch(e) {
                this.buffer.enq(message);
            }    
        }
        //log("debug", "TS3Connection.js", `${this.name} Sending ${message}, ${sent}`);
        return sent;
    }

    public constructor(ts3ip, ts3port, name = null) {
        this.socket = new net.Socket();
        this.connected = false;
        this.ip = ts3ip;
        this.port = ts3port;
        this.name = name !== null ? name : `TS3Connection[${TS3Connection.CONNECTION_COUNTER++}]`;
        this.buffer = CircularBuffer<string>(TS3Connection.CIRCULAR_BUFFER_SIZE);

        const that = this;

        this.socket.on("connect", () => {
            log("info", "TS3Connection.js", "Successfully connected {0} to TS3-Bot on {1}:{2}".formatUnicorn(that.name, that.ip, that.port));
            that.connected = true;
            while(this.buffer.size() > 0) {
                log("debug", "TS3Connection.js", "Emptying buffer after re-establishing connection to TS3-Bot.");
                this.socket.write(this.buffer.deq()); // directly use the socket.write method to avoid endless loops when the socket is already broken again
            }
        });

        this.socket.on("close", () => {
            that.connected = false;
            log("info", "TS3Connection.js", "(Re)connection to TS3-Bot failed. Will attempt to reconnect {0} in {1} milliseconds".formatUnicorn(that.name, RECONNECT_TIMER_MS));
            setTimeout(async () => {
                await this.connect().catch(e => {});
            }, RECONNECT_TIMER_MS);
        });

        this.socket.on("error", (e) => {
            if(e.message.includes("EALREADY")) {
                // when doing multiple unblocking connects from one IP,
                // the server may reject one with error EALREADY, which means
                // another connection is in the process of connecting. 
                // In that case, we just wait a bit and retry (caught through onclose)
                log("info", "TS3Connection.js", "Lockout during TS3Connections. Reconnecting {0} shortly.".formatUnicorn(that.name));
            } else if(e.message.includes("ECONNREFUSED")) {
                log("info", "TS3Connection.js", "TS3Bot is currently not reachable. Is the bot down? Attempting to connect again shortly.".formatUnicorn(that.name));
            }
            else {
                console.log(e);
            }
            
        }); 
        this.connect();
    }

    private async connect() {
        await this.socket.connect(this.port, this.ip);  
    }

    exec() {
        this.connect();
    }    
}


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
enum CommanderState {
    COOLDOWN,
    TAG_UP,
    COMMANDER,
    TAG_DOWN
}

/**
* This class listens for changes in the commander list.
* That is, it reacts to when a commander tags up or down in Teamspeak. 
* Doing so will throw two events "tagup" and "tagdown". 
* The latter will be thrown _after_ the ended lead has been written to the DB.
*/ 
export class TS3Listener extends EventEmitter {
    private connected: boolean;
    private ts3connection: TS3Connection;
    private broadcastChannel: string;
    private pingRole: string;
    private commanderRole: string;
    private activeCommanders: {[key:string]: [string, string, moment.Moment]};
    private users: {[key:string]:[moment.Moment,CommanderState]};
    private channels: {[key:string]:moment.Moment};
    private userDelay: number;
    private channelDelay: number;
    private gracePeriod: number;
    private client: BotgartClient;

    constructor(client: BotgartClient) {
        super();
        /*super("ts3listener", {
            emitter: "client",
            eventName: "ready"
        });*/
        this.client = client;
        this.ts3connection = new TS3Connection(config.ts_listener.ip, config.ts_listener.port);
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
        this.ts3connection.getSocket().on("data", (raw : Buffer) => {
            const data = JSON.parse(raw.toString());
            log("debug", "TS3Listener.js", "Received from TS-Bot: {0}".formatUnicorn(JSON.stringify(data)));
            // COMMANDERS BROADCAST
            if(data.constructor == Object && "commanders" in data) {
                const now: moment.Moment = moment.utc();
                const taggedDown = setMinus(Object.keys(that.activeCommanders), new Set<string>(data.commanders.map(c => c.ts_cluid)));
                that.client.guilds.forEach(g => {
                    data.commanders.forEach(c => {
                        const account  = c.account_name; // for lookup
                        const uid      = c.ts_cluid; // for this.users
                        const username = c.ts_display_name; // for broadcast
                        const channel  = c.ts_channel_name; // for broadcast and this.channels
                        
                        if(!(uid in that.users)) {
                            // user was newly discovered as tagged up -> save user without cooldown
                            that.users[uid] = [now,CommanderState.TAG_UP];
                            log("debug", "TS3Listener.js", "Moving newly discovered {0} to TAG_UP state.".formatUnicorn(username));
                        }
                        let [userLastTime,state] = that.users[uid];
                        switch(state) {
                            case CommanderState.TAG_UP:
                                // user tagged up and is waiting to gain commander status
                                if(now. valueOf() - userLastTime.valueOf() > that.gracePeriod) {
                                    that.users[uid] = [now, CommanderState.COMMANDER];
                                    that.tagUp(g, account, uid, username, channel);
                                    log("debug", "TS3Listener.js", "Moving {0} from TAG_UP to COMMANDER state.".formatUnicorn(username));
                                }
                            break;

                            case CommanderState.COOLDOWN:
                                // user tagged up again too quickly -> wait out delay and then go into TAG_UP
                                if(now.valueOf() - userLastTime.valueOf() > that.userDelay) {
                                    that.users[uid] = [now, CommanderState.TAG_UP];
                                    log("debug", "TS3Listener.js", "Moving {0} from COOLDOWN to TAG_UP state.".formatUnicorn(username));
                                }
                            break;

                            case CommanderState.TAG_DOWN:
                                // user raided before, but tagged down in between
                                // -> if they waited long enough, go into TAG_UP, else sit out COOLDOWN
                                if(now.valueOf() - userLastTime.valueOf() > that.userDelay) {
                                    that.users[uid] = [now, CommanderState.TAG_UP];
                                    log("debug", "TS3Listener.js", "Moving {0} from TAG_DOWN to TAG_UP state.".formatUnicorn(username));
                                } else {
                                    that.users[uid] = [userLastTime, CommanderState.COOLDOWN];
                                    log("debug", "TS3Listener.js", "Moving {0} from TAG_DOWN to COOLDOWN state.".formatUnicorn(username));
                                }
                            break;

                            case CommanderState.COMMANDER:
                                // still raiding -> update timestamp
                                that.users[uid] = [now,state];
                            break;
                        } 
                    });
                    taggedDown.forEach(tduid => {
                        that.users[tduid] = [now, CommanderState.TAG_DOWN];
                        that.tagDown(g, tduid, that.activeCommanders[tduid][0]);
                        log("debug", "TS3Listener.js", "Moving {0} from COOLDOWN, TAG_UP, or COMMANDER to TAG_DOWN state.".formatUnicorn(tduid));
                    })
                });
            }
        });
    }

    /**
    * Makes a user tag up in a Discord-guild. That means:
    * - the raid is being announced in the dedicated channel (if that channel exists)
    * - if the user is not just in TS, but also in Discord, he will gain the commander status there
    * - a mapping of the TS-UID to the Discord-username is created
    */
    private tagUp(g: discord.Guild, account: string, tsUID: string, username: string, channel: string) {
        log("info", "TS3Listener.js", "Tagging up {0} in {1}.".formatUnicorn(username, g.name));
        const registration = (<BotgartClient>this.client).db.getUserByAccountName(account);
        let duser = undefined;
        if(registration) {
            // the commander is member of the current discord -> give role
            const crole = g.roles.find(r => r.name === this.commanderRole);
            duser = g.members.find(m => m.id === registration.user);
            if(crole && duser) {
                duser.addRole(crole);
            }
            username = "{0} ({1})".formatUnicorn(username, registration.registration_role);
        }

        // broadcast the message                    
        let dchan:discord.TextChannel = <discord.TextChannel>g.channels.find(c => c.name === this.broadcastChannel && c instanceof discord.TextChannel);
        if(!dchan) {
            log("warning", "TS3Listener.js", "I was supposed to broadcast the commander message on guild '{0}' in channel '{1}', but no such channel was found there. Skipping.".formatUnicorn(g.name, this.broadcastChannel));
        } else {
            let pingRole = g.roles.find(r => r.name === this.pingRole);
            let mes:string = L.get("COMMANDER_TAG_UP", [username, channel, pingRole ? pingRole.toString() : ""]);
            dchan.send(mes);
        }
        this.activeCommanders[tsUID] = [account, channel, moment.utc()];
        this.emit("tagup", {
            ...{
                "guild": g,
                "account": account, 
                "tsUID": tsUID, 
                "username": username, 
                "channel": channel,
                "discordUser": duser
            }, ...registration});
    }

    /**
    * Makes the user tag down in a Discord-guild. That is:
    * - the role is removed from the user if he is present in the Discord
    * - the user's TS-UID-Discordname is forgotten
    */
    private tagDown(g: discord.Guild, tsUID: string, account: string) {
        let registration = (<BotgartClient>this.client).db.getUserByAccountName(account);
        let duser = undefined;
        if(registration) {
            // the commander is member of the current discord -> remove role
            const crole = g.roles.find(r => r.name === this.commanderRole);
            duser = g.members.find(m => m.id === registration.user);
            if(crole && duser) {
                log("info", "TS3Listener.js", "Tagging down {0} in {1}.".formatUnicorn(duser.displayName, g.name));
                duser.removeRole(crole).catch(e => {
                    log("warning", "TS3Listener.js", "Could not remove role '{0}' from user '{1}'' which was expected to be there. Maybe someone else already removed it.".formatUnicorn(this.commanderRole, duser.nickname))
                });
            }
        }

        const [commander, channel, start] = this.activeCommanders[tsUID];
        (<BotgartClient>this.client).db.addLead(registration.gw2account, start, moment.utc(), channel);
        delete this.activeCommanders[tsUID];
        this.emit("tagdown", {
            ...{
                "guild": g,
                "tsUID": tsUID,
                "account": account,
                "start": start,
                "end": moment.utc(),
                "discordUser": duser
        }, ...registration});
    } 
}