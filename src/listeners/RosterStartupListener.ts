import { Listener } from "discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { logger } from "../Logging";

const LOG = logger();

export class RosterStartupListener extends Listener {
    constructor() {
        super(RosterStartupListener.name, {
            emitter: "client",
            event: "ready"
        });
    }

    exec() {
        LOG.log("info", "Start watching rosters!")
        const client: BotgartClient = <BotgartClient>this.client;
        client.rosterService.onStartup();
    }
}

module.exports = RosterStartupListener;