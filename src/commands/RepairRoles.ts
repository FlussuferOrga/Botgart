import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { DesignatedWorlds } from "../repositories/RegistrationRepository.js";
import { logger } from "../util/Logging.js";
import { Guild } from "discord.js";

const LOG = logger();

/**
 Testcases:
 - run without any changes -> nothing happens (no output either)
 - remove role from user manually after registration -> users should get their roles back (output on console)
 - remove role from server -> error on console
 */
export default class RepairRoles extends BotgartCommand {
    public constructor() {
        super(
            "repairroles",
            {
                aliases: ["repairroles", "rolerepair"],
                channel: "guild",

                // userPermissions: ["ADMINISTRATOR"]
            },
            {
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
                try {
                    const member: discord.GuildMember | null = await guild.members.fetch(d.user);
                    if (!member) {
                        LOG.error(`User ${d.user} is not present in this guild.`);
                    } else {
                        await this.getBotgartClient().validationService.setMemberRolesByWorldId(member, d.current_world_id, "Role Repair");
                    }
                } catch (e) {
                    if (e.code == 10007) {
                        LOG.warn("User %s is not a member anymore. Deleting", d.user);
                        let registration = await cl.registrationRepository.getUserByDiscordId(d.user);
                        if (registration) await cl.registrationRepository.delete(registration);
                    }
                }
            })
        );
    }
}
