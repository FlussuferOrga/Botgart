import { Listener } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import { logger } from "../util/Logging";

const LOG = logger();

export class Disabler extends Listener {
    constructor() {
        super("Disabler", {
            emitter: "client",
            event: "ready",
        });
    }

    exec() {
        function disabler(x, xs) {
            let d = 0;
            const mod = xs.modules.get(x);
            if (mod === undefined) {
                LOG.warn("Could not find a module '{0}' to disable. Skipping".formatUnicorn(x));
            } else {
                d = mod.disable() ? 1 : 0; // yields a boolean, but why would this fail?
                LOG.info("Disabled module '{0}'.".formatUnicorn(x));
            }
            return d;
        }

        const cl: BotgartClient = this.client as BotgartClient;
        let disabled = 0;
        disabled += getConfig()
            .get()
            .disabled.listeners.reduce((acc, l) => acc + disabler(l, cl.listenerHandler), 0);
        disabled += getConfig()
            .get()
            .disabled.inhibitors.reduce((acc, l) => acc + disabler(l, cl.inhibitorHandler), 0);
        disabled += getConfig()
            .get()
            .disabled.commands.reduce((acc, l) => acc + disabler(l, cl.commandHandler), 0);
        LOG.info("Done disabling {0} modules as specified by the config.".formatUnicorn(disabled));
    }
}

module.exports = Disabler;
