"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const discord_akairo_1 = require("discord-akairo");
const Util_1 = require("../Util");
class ReadyListener extends discord_akairo_1.Listener {
    constructor() {
        super("disabler", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        let disabler = function (x, xs) {
            let d = 0;
            let mod = xs.modules.get(x);
            if (mod === undefined) {
                Util_1.log("warning", "ReadyListener.js", "Could not find a module '{0}' to disable. Skipping".formatUnicorn(x));
            }
            else {
                d = mod.disable() ? 1 : 0; // yields a boolean, but why would this fail?
                Util_1.log("info", "ReadyListener.js", "Disabled module '{0}'.".formatUnicorn(x));
            }
            return d;
        };
        let disabled = 0;
        disabled += config.disabled.listeners.reduce((acc, l) => acc + disabler(l, this.client.listenerHandler), 0);
        disabled += config.disabled.inhibitors.reduce((acc, l) => acc + disabler(l, this.client.inhibitorHandler), 0);
        disabled += config.disabled.commands.reduce((acc, l) => acc + disabler(l, this.client.commandHandler), 0);
        Util_1.log("info", "Disabler.js", "Done disabling {0} modules as specified by the config.".formatUnicorn(disabled));
    }
}
exports.ReadyListener = ReadyListener;
module.exports = ReadyListener;
