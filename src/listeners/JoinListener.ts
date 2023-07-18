import { Listener } from "@notenoughupdates/discord-akairo";
import * as L from "../Locale.js";

export default class JoinListener extends Listener {
    constructor() {
        super("JoinListener", {
            emitter: "client",
            event: "guildMemberAdd",
        });
    }

    exec(member) {
        if (!member.user.bot) {
            member.send(L.get("WELCOME"));
        }
    }
}
