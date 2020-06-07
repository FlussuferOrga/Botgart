import { Listener } from "discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { log } from "../Util";

export class PermanentRoleListener extends Listener {
    constructor() {
        super("PermanentRoleListener", {
            emitter: "client",
            event: "guildMemberAdd"
        });
    }

    exec(member) {
        let cl = <BotgartClient>this.client;
        let g = member.guild;
        cl.permanentRoleRepository.getPermanentRoles(member.user.id, g.id).forEach(roleName => {
            let role = g.roles.find(r => r.name === roleName);
            if(role) {
                member.addRole(role, "permanent role");    
                log("info", "Succesfully readded permanent role {0} to user {1}.".formatUnicorn(roleName, member.user.username));
            } else {
                log("warning", "No role with name '{0}' was found on this server, which was configured as permanent role for user {1}. Skipping.".formatUnicorn(roleName, member.user.username));
            }
        });
    }
}

module.exports = PermanentRoleListener;