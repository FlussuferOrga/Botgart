const { Listener } = require("discord-akairo");

class MessageListener extends Listener {
    constructor() {
        super("message", {
            emitter: "client",
            eventName: "message"
        });
    }

    exec(message) {

    }
}

module.exports = MessageListener;