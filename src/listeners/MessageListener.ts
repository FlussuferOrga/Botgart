import { Listener } from "discord-akairo";
import { logger } from "../util/Logging";

const LOG = logger();

export class MessageListener extends Listener {
    constructor() {
        super("message", {
            emitter: "client",
            event: "messageCreate"
        });
    }

    exec(message) {
        // LOG.info("Received Message: %s", message);
    }
}

module.exports = MessageListener;