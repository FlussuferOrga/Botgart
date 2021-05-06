import * as discord from "discord.js";
import * as events from "events";
import * as http from "http";
import * as moment from "moment";
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import { Registration } from "./repositories/RegistrationRepository";
import { logger } from "./util/Logging";

const LOG = logger();

// shouldn't be too large, or else the lockout at start (two concurrent connections connecting at the same time)
// take ages to connect upon boot.
const RECONNECT_TIMER_MS = 3000;
// after failing to reconnect to TS after losing connection once this many times,
// all ongoing raids will be terminated to avoid commanders being credited for seemingly extremely
// long raids after the TS bot has been unreachable for a prolonged time, althrough they have long
// since tagged down.
const RECONNECT_PATIENCE = 10;

export interface TagDown {
    readonly guild: discord.Guild;
    readonly commander: Commander,
    readonly dbRegistration: Registration
}

export interface TagUp {
    readonly guild: discord.Guild,
    readonly commander: Commander,
    readonly dbRegistration: Registration
}

export interface TS3Commander {
    readonly account_name: string;
    readonly ts_cluid: string;
    readonly ts_display_name: string;
    readonly ts_channel_name: string;
    readonly ts_channel_path: string[];
    readonly ts_join_url: string;
}

interface HTTPRequestOptions {
    readonly hostname?: string;
    readonly port?: number;
    readonly path?: string;
    readonly method?: "GET" | "POST" | "PUT" | "DELETE"
    readonly headers?: {
        "Content-Type": "application/json",
        "Content-Length": number
    }
}

export class TS3Connection {
    private static CONNECTION_COUNTER = 1;

    private host: string;
    private port: number;
    private name: string;

    private request(data: unknown, options: HTTPRequestOptions): Promise<string> {
        const dataString: string = JSON.stringify(data);
        const defaults: HTTPRequestOptions = {
            hostname: this.host,
            port: this.port,
            path: "/",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(dataString)
            }
        };
        const settings: HTTPRequestOptions = options === undefined ? defaults : Object.assign({}, defaults, options);
        return new Promise<string>((resolve, reject) => {
            const req = http.request(settings, (response) => {
                let body = "";
                response.on("data", (chunk) => body += chunk);
                response.on("end", () => resolve(body));
            });
            req.on("error", reject);
            req.write(dataString);
            req.end();
        });
    }

    public get(command: string, args: unknown = {}): Promise<string> {
        return this.request(args, {
            path: command,
            method: "GET"
        });
    }

    public post(command: string, args: unknown = {}): Promise<string> {
        return this.request(args, {
            path: command,
            method: "POST"
        });
    }

    public delete(command: string, args: unknown = {}): Promise<string> {
        return this.request(args, {
            path: command,
            method: "DELETE"
        });
    }

    public constructor(ts3host: string, ts3port: number, name?: string) {
        this.host = ts3host;
        this.port = ts3port;
        this.name = name !== undefined ? name : `TS3Connection[${TS3Connection.CONNECTION_COUNTER++}]`;
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
    private ts3channelPath: string[];
    private ts3joinUrl: string;
    private raidStart?: moment.Moment;
    private lastUpdate: moment.Moment;
    private state: CommanderState;
    private discordMember: discord.GuildMember;
    private broadcastMessage: discord.Message | undefined;

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

    public getTs3channelPath(): string[] {
        return this.ts3channelPath;
    }

    public setTs3channelPath(value: string[]) {
        this.ts3channelPath = value;
    }

    public getTs3joinUrl(): string {
        return this.ts3joinUrl;
    }

    public setTs3joinUrl(value: string) {
        this.ts3joinUrl = value;
    }

    public getRaidStart(): moment.Moment | undefined {
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

    public getDiscordMember(): discord.GuildMember | undefined {
        return this.discordMember;
    }

    public setDiscordMember(dmember: discord.GuildMember) {
        this.discordMember = dmember;
    }

    public getBroadcastMessage(): discord.Message | undefined {
        return this.broadcastMessage;
    }

    public setBroadcastMessage(msg: discord.Message | undefined) {
        this.broadcastMessage = msg;
    }


    /**
     * returns: the time of the _ongoing_ raid in seconds. If no raid is going on, 0 is returned.
     *          That means: when this method is called, it assumes the raid is still going on!
     */
    public getRaidTime(): number {
        // this cast is save, since we checked beforehand in the condition of the ternary...
        return this.getRaidStart() !== undefined ? (moment.utc().valueOf() - (this.getRaidStart() as moment.Moment).valueOf()) / 1000 : 0;
    }

    public constructor(accountName: string, ts3DisplayName: string, ts3clientUID: string, ts3channel: string, ts3channelPath: string[], ts3joinUrl: string) {
        this.accountName = accountName;
        this.ts3DisplayName = ts3DisplayName;
        this.ts3clientUID = ts3clientUID;
        this.ts3channel = ts3channel;
        this.ts3channelPath = ts3channelPath;
        this.ts3joinUrl = ts3joinUrl;
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

    public getAllCommanders(): Commander[] {
        return this.commanders;
    }

    public getActiveCommanders(): Commander[] {
        return this.commanders.filter(c => c.getState() === CommanderState.COMMANDER);
    }

    public getCommanderByTS3UID(ts3uid: string) {
        return this.commanders.find(c => c.getTS3ClientUID() === ts3uid);
    }

    public addCommander(commander: Commander) {
        if (this.getCommanderByTS3UID(commander.getTS3ClientUID()) === undefined) {
            this.commanders.push(commander);
        } else {
            LOG.warn(`Tried to add commander to the cache whose TS3UID ${commander.getTS3ClientUID()} was already present. The old object was retained and no update was done!`);
        }
    }

    public deleteCommander(commander: Commander) {
        for (let i = 0; i < this.commanders.length; i++) {
            if (this.commanders[i].getTS3ClientUID() === commander.getTS3ClientUID()) {
                this.commanders.splice(i--, 1);
            }
        }
    }

    public setMinus(stillUp: Set<string>): Commander[] {
        LOG.debug(`Calling setMinus on current commanders ${this.commanders.map(c => c.getTS3ClientUID())}`);
        return this.commanders.filter(c => !stillUp.has(c.getTS3ClientUID()));
    }
}

export interface TagUpEvent {
    readonly guild: discord.Guild;
    readonly commander: Commander;
    readonly dbRegistration: Registration;
}

export interface TagDownEvent {
    readonly guild: discord.Guild;
    readonly commander: Commander;
    readonly dbRegistration: Registration;
}

/**
 * This class listens for changes in the commander list.
 * That is, it reacts to when a commander tags up or down in Teamspeak.
 * Doing so will throw two events "tagup" and "tagdown".
 * The latter will be thrown _after_ the ended lead has been written to the DB.
 */
export class TS3Listener extends events.EventEmitter {
    private ts3connection: TS3Connection;
    private commanderRole: string;
    private channels: { [key: string]: moment.Moment };
    private userDelay: number;
    private channelDelay: number;
    private gracePeriod: number;
    private botgartClient: BotgartClient;
    private patience: number;

    constructor(bgclient: BotgartClient) {
        super();

        const config = getConfig().get();

        this.botgartClient = bgclient;
        this.ts3connection = new TS3Connection(config.ts_listener.ip, config.ts_listener.port);
        this.commanderRole = config.ts_listener.commander_role;
        this.userDelay = config.ts_listener.user_delay;
        this.channelDelay = config.ts_listener.channel_delay;
        this.gracePeriod = config.ts_listener.grace_period;
        this.channels = {};
        this.patience = RECONNECT_PATIENCE;
        this.setMaxListeners(24);
        setInterval(this.checkCommanders.bind(this), config.ts_commander_check_interval);
    }

    private async checkCommanders(): Promise<void> {
        LOG.debug("Requesting commanders from TS-Bot.");
        const now: moment.Moment = moment.utc();
        try {
            const res: string = await this.ts3connection.get("commanders");
            const data: { commanders: TS3Commander[] } = JSON.parse(res); // FIXME: error check
            const commanderTSUIDs: string[] = data.commanders.map(c => c.ts_cluid);
            LOG.debug(`Commanders that are still active: ${JSON.stringify(commanderTSUIDs)}`);
            const taggedDown: Commander[] = this.botgartClient.commanders.setMinus(new Set<string>(commanderTSUIDs));
            LOG.debug("Tagging down: {0}".formatUnicorn(JSON.stringify(taggedDown)));
            this.botgartClient.guilds.cache.forEach(g => {
                data.commanders.forEach(c => {
                    const account = c.account_name; // for lookup
                    const uid = c.ts_cluid; // for this.users
                    const username = c.ts_display_name; // for broadcast
                    const channel = c.ts_channel_name; // for broadcast and this.channels
                    const channel_path = c.ts_channel_path; // for broadcast and this.channels
                    const ts_join_url = c.ts_join_url; // for broadcast and this.channels

                    let commander = this.botgartClient.commanders.getCommanderByTS3UID(uid);
                    if (commander === undefined) {
                        // user was newly discovered as tagged up -> save user without cooldown
                        commander = new Commander(account, username, uid, channel, channel_path, ts_join_url);
                        commander.setState(CommanderState.TAG_UP); // happens in constructor too, but for clarity
                        this.botgartClient.commanders.addCommander(commander);
                        LOG.debug(`Moving newly discovered ${username} to TAG_UP state.`);
                    }

                    const elapsed = now.valueOf() - commander.getLastUpdate().valueOf();
                    switch (commander.getState()) {
                        case CommanderState.TAG_UP:
                            // user tagged up and is waiting to gain commander status
                            if (elapsed > this.gracePeriod) {
                                commander.setLastUpdate(now);
                                commander.setRaidStart(now);
                                commander.setState(CommanderState.COMMANDER);
                                commander.setTS3Channel(channel);
                                commander.setTs3channelPath(channel_path);
                                this.tagUp(g, commander);
                                LOG.debug(`Moving ${username} from TAG_UP to COMMANDER state.`);
                            }
                            break;

                        case CommanderState.COOLDOWN:
                            // user tagged up again too quickly -> wait out delay and then go into TAG_UP
                            if (elapsed > this.userDelay) {
                                commander.setLastUpdate(now);
                                commander.setState(CommanderState.TAG_UP);
                                LOG.debug(`Moving ${username} from COOLDOWN to TAG_UP state.`);
                            }
                            break;

                        case CommanderState.TAG_DOWN:
                            // user raided before, but tagged down in between
                            // -> if they waited long enough, go into TAG_UP, else sit out COOLDOWN
                            if (elapsed > this.userDelay) {
                                commander.setLastUpdate(now);
                                commander.setState(CommanderState.TAG_UP);
                                LOG.debug(`Moving ${username} from TAG_DOWN to TAG_UP state.`);
                            } else {
                                commander.setState(CommanderState.COOLDOWN);
                                LOG.debug(`Moving ${username} from TAG_DOWN to COOLDOWN state.`);
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
                    this.tagDown(g, commander);
                    LOG.debug(`Moving ${commander.getTS3ClientUID()} from COOLDOWN, TAG_UP, or COMMANDER to TAG_DOWN state.`);
                });
            });
            this.patience = RECONNECT_PATIENCE;
        } catch (ex) {
            LOG.error(`Could not retrieve active commanders: ${ex}`);
            // by going as low -1 we do not get an underflow by going indefinitely low
            // but we do the reset only once (when reaching 0) instead of every time after reaching 0.
            this.patience = Math.max(this.patience - 1, -1);
            if (this.patience == 0) {
                LOG.warn(`Could not reconnect to TS after ${RECONNECT_PATIENCE} tries. Tagging down all active commanders.`);
                this.botgartClient.commanders.getAllCommanders()
                    .filter(commander => commander.getDiscordMember() !== undefined)
                    .map(commander => this.botgartClient.guilds.cache.map(g => this.tagDown(g, commander)));
            }

        }
    }

    /**
     * Makes a user tag up in a Discord-guild. That means:
     * - the raid is being announced in the dedicated channel (if that channel exists)
     * - if the user is not just in TS, but also in Discord, he will gain the commander status there
     * - a mapping of the TS-UID to the Discord-username is created
     */
    private async tagUp(g: discord.Guild, commander: Commander) {
        LOG.info(`Tagging up ${(commander.getTS3DisplayName())} in ${g.name}.`);
        const registration = this.botgartClient.registrationRepository.getUserByAccountName(commander.getAccountName());

        let duser: discord.GuildMember | undefined;
        if (registration !== undefined) {
            // the commander is member of the current discord -> give role
            duser = await g.members.fetch(registration.user); // cache.find(m => m.id === registration.user);
            if (duser === undefined) {
                LOG.warn(`Tried to find GuildMember for user with registration ID ${registration.user}, but could not find any. Maybe this is a caching problem?`);
            }
            commander.setDiscordMember(duser);

            await this.tagUpAssignRole(g, commander);
        }

        await this.botgartClient.tagBroadcastService.sendTagUpBroadcast(g, commander, duser, registration)
            .then(value => commander.setBroadcastMessage(value))
            .catch(e => LOG.error("Could send tag up broadcast", e));

        this.emit("tagup", {
            "guild": g,
            "commander": commander,
            "dbRegistration": registration
        });
    }

    /**
     * Makes the user tag down in a Discord-guild. That is:
     * - the role is removed from the user if he is present in the Discord
     * - the user's TS-UID-Discordname is forgotten
     */
    private async tagDown(g: discord.Guild, commander: Commander) {
        const registration: Registration | undefined = this.botgartClient.registrationRepository.getUserByAccountName(commander.getAccountName());
        let dmember: discord.GuildMember | undefined = undefined;

        try {
            await this.botgartClient.tagBroadcastService.tagDownBroadcast(commander);
        } catch (e) {
            LOG.error("Could not close broadcast on tagdown", e);
        }

        if (registration !== undefined) {
            dmember = await g.members.fetch(registration.user);
            try {
                await this.tagDownRemoveRole(g, dmember);
            } catch (e) {
                LOG.error("Could not unassign commander role from user", e);
            }

            this.tagDownWriteToDb(dmember, commander, registration);
            LOG.debug("Done processing commander. Will now send out tagdown event.");
        }

        this.botgartClient.commanders.deleteCommander(commander);
        this.emit("tagdown", {
            "guild": g,
            "commander": commander,
            "dbRegistration": registration
        });
    }

    private tagDownWriteToDb(dmember: discord.GuildMember, commander: Commander, registration: Registration) {
        // do not write leads of members which hide their roles
        const writeToDB = !(dmember && dmember.roles.cache.find(r => getConfig().get().achievements.ignoring_roles.includes(r.name)));
        if (writeToDB) {
            LOG.debug("Writing raid information to database.");
            if (commander.getRaidStart() === undefined) {
                LOG.error(`Wanted to write raid for commander ${dmember.displayName} ` +
                    "during tag-down, but no raid start was stored.");
            } else {
                this.botgartClient.tsLeadRepository.addLead(
                    registration.gw2account,
                    commander.getRaidStart() as moment.Moment,
                    moment.utc(),
                    commander.getTS3Channel());
            }
            LOG.debug("Done writing to database.");
        }
    }

    private async tagUpAssignRole(g: discord.Guild, commander: Commander) {
        const crole = g.roles.cache.find(r => r.name === this.commanderRole);
        if (crole && commander.getDiscordMember()) {
            await commander.getDiscordMember()?.roles.add(crole)
                .catch(e => LOG.warn(`Could not remove role '${this.commanderRole}' from ` +
                    `user '${(commander.getDiscordMember() as discord.GuildMember).displayName}'`, e));
        }
    }

    private async tagDownRemoveRole(g: discord.Guild, dmember: discord.GuildMember | undefined) {
        // the commander is member of the current discord -> remove role
        // since removing roles has gone wrong a lot lately,
        // we're updating the cache manually
        // https://discord.js.org/#/docs/main/stable/class/RoleManager?scrollTo=fetch
        const crole: discord.Role | undefined = (await g.roles.fetch()).cache.find(r => r.name === this.commanderRole);
        if (crole && dmember) {
            LOG.info(`Tagging down ${dmember.displayName} in ${g.name}, will remove their role ${crole}.`);
            await dmember.roles.remove(crole)
                .catch(e => LOG.warn(`Could not remove role '${this.commanderRole}' from user ` +
                    `'${(dmember as discord.GuildMember).displayName}' which was expected to be there.` +
                    ` Maybe someone else already removed it. ${e}`));

            LOG.debug("Done managing roles for former commander.");
        }
    }
}