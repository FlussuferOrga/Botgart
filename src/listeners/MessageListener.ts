import { Listener } from "discord-akairo";

export class MessageListener extends Listener {
    constructor() {
        super("message", {
            emitter: "client",
            eventName: "message"
        });
    }

    exec(message) {

    }
}