import { Listener } from  "discord-akairo";
import * as L from "../Locale.js";

export class JoinListener extends Listener {
    constructor() {
        super("JoinListener", {
            emitter: "client",
            eventName: "guildMemberAdd"
        });
    }

    exec(member) {
        if(!member.user.bot) {
            member.send(L.get("WELCOME"));
        }
    }
}

module.exports = JoinListener;