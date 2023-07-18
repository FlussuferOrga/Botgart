import * as discord from "discord.js";
import { Registration } from "./mikroorm/entities/Registration.js";
import { logger } from "./util/Logging.js";
import { DateTime } from "luxon";

const LOG = logger();

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
export enum CommanderState {
    COOLDOWN,
    TAG_UP,
    COMMANDER,
    TAG_DOWN,
}

export type LeadType = "UNKNOWN" | "PPT" | "PPK";

export class Commander {
    private accountName: string;
    private ts3DisplayName: string;
    private ts3clientUID: string;
    private ts3channel: string;
    private ts3channelPath: string[];
    private ts3joinUrl: string;
    private raidStart?: DateTime;
    private raidEnd?: DateTime;
    private lastUpdate: DateTime;
    private state: CommanderState;
    private discordMember: discord.GuildMember;
    private broadcastMessage: discord.Message | undefined;
    private currentLeadType: LeadType;
    private registration: Registration | undefined;

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

    public getRaidStart(): DateTime | undefined {
        return this.raidStart;
    }

    public setRaidStart(timestamp: DateTime) {
        this.raidStart = timestamp;
    }

    public getRaidEnd(): DateTime | undefined {
        return this.raidEnd;
    }

    public setRaidEnd(timestamp: DateTime) {
        this.raidEnd = timestamp;
    }

    public getLastUpdate(): DateTime {
        return this.lastUpdate;
    }

    public setLastUpdate(timestamp: DateTime) {
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

    public getCurrentLeadType(): "UNKNOWN" | "PPT" | "PPK" {
        return this.currentLeadType;
    }

    public setCurrentLeadType(value: "UNKNOWN" | "PPT" | "PPK") {
        this.currentLeadType = value;
    }
    public constructor(
        accountName: string,
        ts3DisplayName: string,
        ts3clientUID: string,
        ts3channel: string,
        ts3channelPath: string[],
        ts3joinUrl: string
    ) {
        this.accountName = accountName;
        this.ts3DisplayName = ts3DisplayName;
        this.ts3clientUID = ts3clientUID;
        this.ts3channel = ts3channel;
        this.ts3channelPath = ts3channelPath;
        this.ts3joinUrl = ts3joinUrl;
        this.lastUpdate = DateTime.utc();
        this.raidStart = undefined;
        this.state = CommanderState.TAG_UP;
    }

    public getRegistration(): Registration | undefined {
        return this.registration;
    }

    public setRegistration(registraton: Registration | undefined) {
        this.registration = registraton;
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
        return this.commanders.filter((c) => c.getState() === CommanderState.COMMANDER);
    }

    public getCommanderByTS3UID(ts3uid: string) {
        return this.commanders.find((c) => c.getTS3ClientUID() === ts3uid);
    }

    public addCommander(commander: Commander) {
        if (this.getCommanderByTS3UID(commander.getTS3ClientUID()) === undefined) {
            this.commanders.push(commander);
        } else {
            LOG.warn(
                `Tried to add commander to the cache whose TS3UID ${commander.getTS3ClientUID()} was already present. The old object was retained and no update was done!`
            );
        }
    }

    public deleteCommander(commander: Commander) {
        for (let i = 0; i < this.commanders.length; i++) {
            if (this.commanders[i].getTS3ClientUID() === commander.getTS3ClientUID()) {
                this.commanders.splice(i--, 1);
            }
        }
    }

    public getTaggedDown(stillUp: Set<string>): Commander[] {
        return this.commanders.filter((c) => !stillUp.has(c.getTS3ClientUID()));
    }
}
