"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
class MessageListener extends discord_akairo_1.Listener {
    constructor() {
        super("message", {
            emitter: "client",
            eventName: "message"
        });
    }
    exec(message) {
    }
}
exports.MessageListener = MessageListener;
module.exports = MessageListener;
