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

    private static MESSAGE_ID: number = 1;

    private socket: net.Socket;
    private connected: boolean;
    private ip: string;
    private port: number;
    private name: string;
    private buffer: CircularBuffer<string>;

    public getSocket(): net.Socket {
        return this.socket;
    }

    private write(message : string): boolean {
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

    private writeCommand(type: string, command: string, args: object) {
        const mesId = TS3Connection.MESSAGE_ID++;
        this.write(JSON.stringify({
            "type": type,
            "command": command,
            "args": args,
            "message_id": mesId
        }));
    }

    public post(command: string, args: object) {
        this.writeCommand("post", command, args);
    }



    public delete(command: string, args: object) {
        this.writeCommand("delete", command, args);
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

export class Commander {
    private accountName: string;
    private ts3DisplayName: string;
    private ts3clientUID: string;
    private ts3channel: string;
    private raidStart: moment.Moment;
    private lastUpdate: moment.Moment;
    private state: CommanderState;
    private discordMember: discord.GuildMember;

    public getAccountName(): string {
        return this.accountName;
    }

    public getTS3ClientUID(): string {
        return this.ts3clientUID;
    }

    public getTS3DisplayName(): string {
        return this.ts3DisplayName;
    }

    public setTS3DisplayName(name: string) {
        this.ts3DisplayName = name;
    }

    public getTS3Channel(): string {
        return this.ts3channel;
    }

    public setTS3Channel(ts3channel: string) {
        this.ts3channel = ts3channel;
    }

    public getRaidStart(): moment.Moment {
        return this.raidStart;
    }

    public setRaidStart(timestamp: moment.Moment) {
        this.raidStart = timestamp;
    }

    public getLastUpdate(): moment.Moment {
        return this.lastUpdate;
    }

    public setLastUpdate(timestamp: moment.Moment) {
        this.lastUpdate = timestamp;
    }

    public getState(): CommanderState {
        return this.state;
    }

    public setState(state: CommanderState) {
        this.state = state;
    }

    public getDiscordMember(): discord.GuildMember {
        return this.discordMember;
    }

    public setDiscordMember(dmember: discord.GuildMember) {
        this.discordMember = dmember;
    }

    /**
    * returns: the time of the ongoing raid in seconds. If no raid is going on, 0 is returned.
    */
    public getRaidTime(): number {
        return this.getRaidStart() !== undefined ? (moment.utc().valueOf() - this.getRaidStart().valueOf())/1000 : 0;
    }

    public constructor(accountName: string, ts3DisplayName: string, ts3clientUID: string, ts3channel: string) {
        this.accountName = accountName;
        this.ts3DisplayName = ts3DisplayName;
        this.ts3clientUID = ts3clientUID;
        this.ts3channel = ts3channel;
        this.lastUpdate = moment.utc();
        this.raidStart = undefined;
        this.state = CommanderState.TAG_UP;
    }
}

export class CommanderStorage {
    private commanders: Commander[];

    public constructor() {
        this.commanders = [];
    }

    public getActiveCommanders(): Commander[] {
        return this.commanders.filter(c => c.getState() === CommanderState.COMMANDER);
    }

    public getCommanderByTS3UID(ts3uid: string) {
        return this.commanders.find(c => c.getTS3ClientUID() === ts3uid);
    }

    public addCommander(commander: Commander) {
        if(this.getCommanderByTS3UID(commander.getTS3ClientUID()) === undefined) {
            log("warning", "TS3Connection.js", `Tried to add commander to the cache whose TS3UID ${commander.getTS3ClientUID()} was already present. The old object was retained and no update was done!`);           
        } else {
            this.commanders.push(commander);    
        } 
    }

    public deleteCommander(commander: Commander) {
        let i = 0;
        while(i < this.commanders.length) {
            if(this.commanders[i].getTS3ClientUID() === commander.getTS3ClientUID()) {
                this.commanders.splice(i,1);
                i = this.commanders.length; // break
            }
        }
    }

    public setMinus(stillUp: Set<string>): Commander[] {
        return this.commanders.filter(c => !stillUp.has(c.getTS3ClientUID()));
    }
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
    //private activeCommanders: {[key:string]: [string, string, moment.Moment]};
    //private activeCommanders: {[key:string]: Commander};
    //private commanders: CommanderCache;
    //private users: {[key:string]:[moment.Moment,CommanderState]};
    //private users: {[key: string]: Commander};
    private channels: {[key:string]:moment.Moment};
    private userDelay: number;
    private channelDelay: number;
    private gracePeriod: number;
    private botgartClient: BotgartClient;

    constructor(bgclient: BotgartClient) {
        super();
        this.botgartClient = bgclient;
        this.ts3connection = new TS3Connection(config.ts_listener.ip, config.ts_listener.port);
        this.broadcastChannel = config.ts_listener.broadcast_channel;
        this.pingRole = config.ts_listener.ping_role;
        this.commanderRole = config.ts_listener.commander_role;
        this.userDelay = config.ts_listener.user_delay;
        this.channelDelay = config.ts_listener.channel_delay;
        this.gracePeriod = config.ts_listener.grace_period;
        this.channels = {};

        const that = this;
        this.ts3connection.getSocket().on("data", (raw : Buffer) => {
            const data = JSON.parse(raw.toString());
            log("debug", "TS3Listener.js", "Received from TS-Bot: {0}".formatUnicorn(JSON.stringify(data)));
            // COMMANDERS BROADCAST
            if(data.constructor == Object && "commanders" in data) {
                const now: moment.Moment = moment.utc();
                const taggedDown: Commander[] = that.botgartClient.commanders.setMinus(new Set<string>(data.commanders.map(c => c.ts_cluid))); 
                that.botgartClient.guilds.forEach(g => {
                    data.commanders.forEach(c => {
                        const account  = c.account_name; // for lookup
                        const uid      = c.ts_cluid; // for this.users
                        const username = c.ts_display_name; // for broadcast
                        const channel  = c.ts_channel_name; // for broadcast and this.channels
                        
                        let commander = this.botgartClient.commanders.getCommanderByTS3UID(uid);
                        if(commander === undefined) {
                            // user was newly discovered as tagged up -> save user without cooldown
                            commander = new Commander(account, username, uid, channel);
                            commander.setState(CommanderState.TAG_UP); // happens in constructor too, but for clarity
                            that.botgartClient.commanders.addCommander(commander);
                            log("debug", "TS3Listener.js", `Moving newly discovered ${username} to TAG_UP state.`);
                        }

                        const elapsed = now.valueOf() - commander.getLastUpdate().valueOf();
                        switch(commander.getState()) {
                            case CommanderState.TAG_UP:
                                // user tagged up and is waiting to gain commander status
                                if(elapsed > that.gracePeriod) {
                                    commander.setLastUpdate(now);
                                    commander.setRaidStart(now);
                                    commander.setState(CommanderState.COMMANDER);
                                    commander.setTS3Channel(channel);
                                    that.tagUp(g, commander);
                                    log("debug", "TS3Listener.js", `Moving ${username} from TAG_UP to COMMANDER state.`);
                                }
                            break;

                            case CommanderState.COOLDOWN:
                                // user tagged up again too quickly -> wait out delay and then go into TAG_UP
                                if(elapsed > that.userDelay) {
                                    commander.setLastUpdate(now);
                                    commander.setState(CommanderState.TAG_UP);
                                    log("debug", "TS3Listener.js", `Moving ${username} from COOLDOWN to TAG_UP state.`);
                                }
                            break;

                            case CommanderState.TAG_DOWN:
                                // user raided before, but tagged down in between
                                // -> if they waited long enough, go into TAG_UP, else sit out COOLDOWN
                                if(elapsed > that.userDelay) {
                                    commander.setLastUpdate(now);
                                    commander.setState(CommanderState.TAG_UP);
                                    log("debug", "TS3Listener.js", `Moving ${username} from TAG_DOWN to TAG_UP state.`);
                                } else {
                                    commander.setState(CommanderState.COOLDOWN);
                                    log("debug", "TS3Listener.js", `Moving ${username} from TAG_DOWN to COOLDOWN state.`);
                                }
                            break;

                            case CommanderState.COMMANDER:
                                // still raiding -> update timestamp
                                commander.setLastUpdate(now);
                            break;
                        } 
                    });
                    taggedDown.forEach((commander: Commander) => {
                        commander.setLastUpdate(now);
                        commander.setState(CommanderState.TAG_DOWN);
                        that.tagDown(g, commander);
                        log("debug", "TS3Listener.js", `Moving ${commander.getTS3ClientUID()} from COOLDOWN, TAG_UP, or COMMANDER to TAG_DOWN state.`);
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
    private tagUp(g: discord.Guild, commander: Commander) {
        let displayname = commander.getTS3DisplayName();
        log("info", "TS3Listener.js", `Tagging up ${displayname} in ${g.name}.`);
        const registration = this.botgartClient.db.getUserByAccountName(commander.getAccountName());
        if(registration) {
            // the commander is member of the current discord -> give role
            const crole = g.roles.find(r => r.name === this.commanderRole);
            commander.setDiscordMember(g.members.find(m => m.id === registration.user));
            if(crole && commander.getDiscordMember()) {
                commander.getDiscordMember().addRole(crole);
            }
            displayname = `${displayname} (${registration.registration_role})`;
        }

        // broadcast the message                    
        const dchan: discord.TextChannel = <discord.TextChannel>g.channels.find(c => c.name === this.broadcastChannel && c instanceof discord.TextChannel);
        if(!dchan) {
            log("warning", "TS3Listener.js", `I was supposed to broadcast the commander message on guild '${g.name}' in channel '${this.broadcastChannel}', but no such channel was found there. Skipping.`);
        } else {
            const pingRole = g.roles.find(r => r.name === this.pingRole);
            const mes: string = L.get("COMMANDER_TAG_UP", [displayname, commander.getTS3Channel(), pingRole ? pingRole.toString() : ""]);
            dchan.send(mes);
        }
        this.emit("tagup", {
            ...{
                "guild": g,
                "account": commander.getAccountName(), 
                "tsUID": commander.getTS3ClientUID(), 
                "username": commander.getTS3DisplayName(), 
                "channel": commander.getTS3Channel(),
                "discordMember": commander.getDiscordMember()
            }, ...registration});
    }

    /**
    * Makes the user tag down in a Discord-guild. That is:
    * - the role is removed from the user if he is present in the Discord
    * - the user's TS-UID-Discordname is forgotten
    */
    private tagDown(g: discord.Guild, commander: Commander) {
        let registration = this.botgartClient.db.getUserByAccountName(commander.getAccountName());
        let dmember = undefined;
        if(registration) {
            // the commander is member of the current discord -> remove role
            const crole = g.roles.find(r => r.name === this.commanderRole);
            dmember = g.members.find(m => m.id === registration.user);
            if(crole && dmember) {
                log("info", "TS3Listener.js", `Tagging down ${dmember.displayName} in ${g.name}.`);
                dmember.removeRole(crole).catch(e => {
                    log("warning", "TS3Listener.js", `Could not remove role '${this.commanderRole}' from user '${dmember.nickname}'' which was expected to be there. Maybe someone else already removed it.`)
                });
            }
        }

        this.botgartClient.db.addLead(registration.gw2account, commander.getRaidStart(), moment.utc(), commander.getTS3Channel());
        this.botgartClient.commanders.deleteCommander(commander);
        this.emit("tagdown", {
            ...{
                "guild": g,
                "tsUID": commander.getTS3ClientUID(),
                "account": commander.getAccountName(),
                "start": commander.getRaidStart(),
                "end": moment.utc(),
                "discordMember": commander.getDiscordMember()
        }, ...registration});
    } 
}