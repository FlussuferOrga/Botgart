import * as events from "events";
import { getConfig } from "../config/Config";
import { createApiInstance } from "../Gw2ApiUtils";


enum WvWMapNames {
    Center = "Center",
    BlueHome = "BlueHome",
    GreenHome = "GreenHome",
    RedHome = "RedHome"
}

interface Objective {
    "id": string
    "type": string
    "owner": string
    "last_flipped": string
    "claimed_by": string | null
    "claimed_at": string | null
    "points_tick": number,
    "points_capture": number,
    "guild_upgrades": number[],
    "yaks_delivered?": number
}

interface RGBNumbers {
    readonly red: number;
    readonly blue: number;
    readonly green: number
}

interface MapStats {
    readonly id: number;
    readonly type: WvWMapNames,
    readonly scores: RGBNumbers[],
    readonly bonues: string[],
    readonly objectives: Objective[],
    readonly deaths: RGBNumbers[],
    readonly kills: RGBNumbers[]
}

export interface WvWMatches {
    readonly id: string;
    readonly start_time: string;
    readonly end_time: string;
    readonly scores: RGBNumbers;
    readonly worlds: RGBNumbers;
    readonly all_worlds: { red: number[], blue: number[], green: number[] };
    readonly deaths: RGBNumbers;
    readonly kills: RGBNumbers;
    readonly victory_points: RGBNumbers;
    readonly skirmishes: { id: number, scores: RGBNumbers, map_scores: unknown[] }[]
    readonly maps: MapStats[]
}

export class APIEmitter extends events.EventEmitter {
    public readonly name: string;
    public readonly interval: number;

    public constructor() {
        super();

        //this.schedule("wvw-objectives", api => api.wvw().objectives(), 60000);
        //this.schedule("wvw-upgrades", api => api.wvw().upgrades(), 1000);
        const homeId = getConfig().get().home_id;
        this.schedule("wvw-stats",
            api => api.wvw().matches().live().stats().world(homeId)
                .catch(err => console.log(`Error while fetching match stats: ${err}`)),
            getConfig().get().gw2api.delays.wvw_stats);
        this.schedule("wvw-matches",
            api => api.wvw().matches().live().world(homeId)
                .catch(err => console.log(`Error while fetching match details: ${err}`)),
            getConfig().get().gw2api.delays.wvw_matches);

    }

    public schedule(name: string, endpoint: (gw2) => Promise<unknown>, interval: number): void {
        //endpoint(api).then(r => console.log(name, r));
        const gw = createApiInstance();
        setInterval(() => this.emit(name, endpoint(gw)), interval);
    }
}