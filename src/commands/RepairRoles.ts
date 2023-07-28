import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { DesignatedWorlds } from "../repositories/RegistrationRepository.js";
import { logger } from "../util/Logging.js";
import { Guild, GuildMember } from "discord.js";

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
                let member: GuildMember | null = await this.getMember(guild, d);
                if (member) {
                    await this.getBotgartClient().validationService.setMemberRolesByWorldId(member, d.current_world_id, "Role Repair");
                } else {
                    let registration = await cl.registrationRepository.getUserByDiscordId(d.user);
                    if (registration) {
                        await this.getBotgartClient().validationService.deleteMember(registration, undefined, "User left the server");
                    }
                }
            })
        );
    }

    private async getMember(guild: Guild, d: DesignatedWorlds): Promise<GuildMember | null> {
        try {
            return await guild.members.fetch({ user: d.user });
        } catch (e) {
            if (e.code == 10007) {
                LOG.warn("User %s is not a member anymore.", d.user);
                return null;
            }
            throw e;
        }
    }
}
