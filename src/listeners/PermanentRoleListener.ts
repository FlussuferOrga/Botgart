import { Listener } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient.js";
import { logger } from "../util/Logging.js";
import { CreateRequestContext } from "@mikro-orm/core";

const LOG = logger();

export default class PermanentRoleListener extends Listener {
    constructor() {
        super("PermanentRoleListener", {
            emitter: "client",
            event: "guildMemberAdd",
        });
    }

    @CreateRequestContext((type: Listener) => (type.client as BotgartClient).orm)
    async exec(member) {
        const cl = this.client as BotgartClient;
        const g = member.guild;
        const permanentRoles = await cl.permanentRoleRepository.getPermanentRoles(member.user.id, g.id);
        permanentRoles.forEach((roleName) => {
            const role = g.roles.find((r) => r.name === roleName);
            if (role) {
                member.addRole(role, "permanent role");
                LOG.info("Succesfully re-added permanent role {0} to user {1}.".formatUnicorn(roleName, member.user.username));
            } else {
                LOG.warn(
                    "No role with name '{0}' was found on this server, which was configured as permanent role for user {1}. Skipping.".formatUnicorn(
                        roleName,
                        member.user.username
                    )
                );
            }
        });
    }
}
