import * as moment from "moment";

export class Raid {
    private start: moment.Moment;
    private end: moment.Moment;
    public readonly channel: string;

    public getStart(): moment.Moment {
        return this.start;
    }

    public getEnd(): moment.Moment {
        return this.end;
    }

    public duration(): number {
        return this.end === undefined 
                ? 0
                : this.end.diff(this.start);
    }

    public constructor(start: moment.Moment, end: moment.Moment, channel: string) {
        this.start = start;
        this.end = end;
        this.channel = channel;
    }

    public stop(end: moment.Moment) {
        this.end = end;
    }
}

export class History {
    public readonly firstRaid: Raid;
    public readonly lastRaid: Raid;
    public readonly raidCount: number;
    public readonly totalRaidTime: number;

    public constructor() {

    }

    public static loadFromDB(): History {
        return null;
    }
}

export class Progress {
    private gw2account: string;
    private history: History;
    private currentRaid: Raid;

    public contructor(gw2account: string) {
        this.gw2account = gw2account;
    }

    public startRaid(start: moment.Moment, channel: string) {
        this.currentRaid = new Raid(start, undefined, channel);
    }

    public endRaid(end: moment.Moment) {
        this.currentRaid.stop(end);
    }

    
}