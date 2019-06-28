"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
const Util_1 = require("../Util");
class PermanentRoleListener extends discord_akairo_1.Listener {
    constructor() {
        super("PermanentRoleListener", {
            emitter: "client",
            eventName: "guildMemberAdd"
        });
    }
    exec(member) {
        return;
        let cl = this.client;
        let g = member.guild;
        cl.db.getPermanentRoles(member.user.id, g.id).forEach(roleName => {
            let role = g.roles.find(r => r.name === roleName);
            if (role) {
                member.addRole(role, "permanent role");
                Util_1.log("info", "PermanentRoleListener.js", "Succesfully readded permanent role {0} to user {1}.".formatUnicorn(roleName, member.user.username));
            }
            else {
                Util_1.log("warning", "PermanentRoleListener.js", "No role with name '{0}' was found on this server, which was configured as permanent role for user {1}. Skipping.".formatUnicorn(roleName, member.user.username));
            }
        });
    }
}
exports.PermanentRoleListener = PermanentRoleListener;
module.exports = PermanentRoleListener;
