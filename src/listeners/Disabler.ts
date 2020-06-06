const config = require("../../config.json");
import { Listener } from "discord-akairo";
import { log } from "../Util";
import { BotgartClient } from "../BotgartClient";

export class Disabler extends Listener {
    constructor() {
        super("Disabler", {
            emitter: "client",
            event: "ready"
        });
    }

    exec() {
        let disabler = function(x,xs) {
            let d = 0;
            let mod = xs.modules.get(x);
            if(mod === undefined) {
                log("warning", "Could not find a module '{0}' to disable. Skipping".formatUnicorn(x));
            } else {
                d = mod.disable() ? 1 : 0; // yields a boolean, but why would this fail?
                log("info", "Disabled module '{0}'.".formatUnicorn(x));
            }
            return d;
        };

        const cl: BotgartClient = <BotgartClient>this.client;
        let disabled = 0;
        disabled += config.disabled.listeners.reduce((acc, l) => acc + disabler(l, cl.listenerHandler), 0); 
        disabled += config.disabled.inhibitors.reduce((acc, l) => acc + disabler(l, cl.inhibitorHandler), 0);
        disabled += config.disabled.commands.reduce((acc, l) => acc + disabler(l, cl.commandHandler), 0);
        log("info", "Done disabling {0} modules as specified by the config.".formatUnicorn(disabled));
    }
}

module.exports = Disabler;