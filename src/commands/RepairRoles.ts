import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { DesignatedWorlds } from "../repositories/RegistrationRepository";
import { logger } from "../util/Logging";
import * as Gw2ApiUtils from "../Gw2ApiUtils";
import { Guild } from "discord.js";

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
        this.repairRoles(guild);
    }

    private async repairRoles(guild: Guild) {
        LOG.info(`Starting role repair.`);

        const cl = this.getBotgartClient();
        const designations: DesignatedWorlds[] = await cl.registrationRepository.getDesignatedRoles(guild.id);
        LOG.info(`Found ${designations.length} users to check.`);

        await Promise.all(
            designations.map(async (d) => {
                const member: discord.GuildMember | null = await guild.members.fetch(d.user);
                if (!member) {
                    LOG.error(`User ${d.user} is not present in this guild.`);
                } else {
                    await this.getBotgartClient().validationService.setMemberRolesByWorldId(member, d.current_world_id, "Role Repair");
                }
            })
        );
    }
}

module.exports = RepairRoles;
