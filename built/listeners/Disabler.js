"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const discord_akairo_1 = require("discord-akairo");
class ReadyListener extends discord_akairo_1.Listener {
    constructor() {
        super("disabler", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        let disabler = function (x, xs) {
            let mod = xs.modules.get(x);
            if (mod === undefined) {
                log("warn", "ReadyListener.js", "Could not find a module '{0}' to disable. Skipping".formatUnicorn(x));
            }
            else {
                mod.disable(); // yields a boolean, but why would this fail?
                log("info", "ReadyListener.js", "Disabled module '{0}'.".formatUnicorn(x));
            }
        };
        config.disabled.listeners.forEach(l => disabler(l, this.client.listenerHandler));
        config.disabled.inhibitors.forEach(l => disabler(l, this.client.inhibitorHandler));
        config.disabled.commands.forEach(l => disabler(l, this.client.commandHandler));
        console.log("disabled");
    }
}
exports.ReadyListener = ReadyListener;
module.exports = ReadyListener;
