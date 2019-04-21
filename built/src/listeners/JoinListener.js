const { Listener } = require("discord-akairo");
var L = require("../Locale.js");
class JoinListener extends Listener {
    constructor() {
        super("guildMemberAdd", {
            emitter: "client",
            eventName: "guildMemberAdd"
        });
    }
    exec(member) {
        if (!member.user.bot) {
            member.send(L.get("WELCOME"));
        }
    }
}
module.exports = JoinListener;
