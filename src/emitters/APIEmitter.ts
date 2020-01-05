const config = require("../../config.json");
import { log, api } from "../Util";
import EventEmitter from "events"
import { gw2 } from "gw2api-client"
import { BotgartClient } from "../BotgartClient"

export class APIEmitter extends EventEmitter {
    public readonly name: string;
    public readonly interval: number;

    public constructor() {
        super();
        //this.schedule("wvw-objectives", api => api.wvw().objectives(), 60000);
        //this.schedule("wvw-upgrades", api => api.wvw().upgrades(), 1000);
        this.schedule("wvw-matches", api => api.wvw().matches().world(config.home_id)
                                            .catch(err => console.log(`Error while fetching match details: ${err}`))
                                   , 10000);

    }

    public schedule(name: string, endpoint: (gw2) => any, interval: number): void {
        setInterval(() => this.emit(name, endpoint(api)), interval);
    }
}