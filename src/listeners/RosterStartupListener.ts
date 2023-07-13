import { Listener } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { logger } from "../util/Logging";
import { UseRequestContext } from "@mikro-orm/core";

const LOG = logger();

export class RosterStartupListener extends Listener {
    constructor() {
        super("rosterStartup", {
            emitter: "client",
            event: "ready",
        });
    }

    @UseRequestContext((type: Listener) => (type.client as BotgartClient).orm)
    exec() {
        LOG.info("Start watching rosters!");
        const client: BotgartClient = this.client as BotgartClient;
        client.rosterService.onStartup();
    }
}

module.exports = RosterStartupListener;
