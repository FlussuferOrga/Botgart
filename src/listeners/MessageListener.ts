import { Listener } from "discord-akairo";

export class MessageListener extends Listener {
    constructor() {
        super("message", {
            emitter: "client",
            event: "message"
        });
    }

    exec(message) {

    }
}

module.exports = MessageListener;