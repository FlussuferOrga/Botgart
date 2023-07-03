import * as discord from "discord.js";
import {BotgartCommand} from "../BotgartCommand";
import {DesignatedWorlds} from "../repositories/RegistrationRepository";
import {logger} from "../util/Logging";
import * as Gw2ApiUtils from "../Gw2ApiUtils";

const LOG = logger();

/**
 Testcases:
 - run without any changes -> nothing happens (no output either)
 - remove role from user manually after registration -> users should get their roles back (output on console)
 - remove role from server -> error on console
 */
export class RepairRoles extends BotgartCommand {
    public constructor() {
        super(
            "repairroles",
            {
                aliases: ["repairroles", "rolerepair"],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                availableAsDM: true,
                cronable: true,
            }
        );
    }

    public async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Record<string, unknown>): Promise<void> {
        // noinspection ES6MissingAwait
        this.repairRoles();
    }

    private async repairRoles() {
        LOG.info(`Starting role repair.`);

        const cl = this.getBotgartClient();
        const designations: DesignatedWorlds[] = cl.registrationRepository.getDesignatedRoles();
        LOG.info(`Found ${designations.length} users to check.`);


        await Promise.all(
            designations.map(async (d) => {
                let guild: discord.Guild | null = await cl.guilds.fetch(d.guild);
                // check again, in case lookup fails
                if (guild == null) {
                    LOG.error(`Could not look up a guild with ID ${d.guild}. Have I been kicked?`);
                } else {
                    const member: discord.GuildMember | null = await guild.members.fetch(d.user);
                    if (!member) {
                        LOG.error(`User ${d.user} is not present in this guild.`);
                    } else {
                        await this.getBotgartClient().validationService.setMemberRolesByWorldId(member, d.current_world_id, "Role Repair");
                    }
                }
            })
        );
    }
}

module.exports = RepairRoles;
