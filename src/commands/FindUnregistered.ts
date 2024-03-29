import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient.js";
import { BotgartCommand } from "../BotgartCommand.js";
import { getConfig, WorldAssignment } from "../config/Config.js";
import { splitMessage } from "../util/Util.js";

export default class FindUnregistered extends BotgartCommand {
    constructor() {
        super("findunregistered", {
            aliases: ["findunregistered", "findunreg"],
            channel: "guild",
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args) {
        const cl: BotgartClient = this.getBotgartClient();
        const registrations = await cl.registrationRepository.loadUserIds(guild.id);

        const worldRoleNames = getConfig()
            .get()
            .world_assignments.map((val: WorldAssignment) => val.role);

        guild.members
            .fetch()
            .then(async (members) =>
                members
                    .filter((member) => !member.user.bot)
                    .filter((member) => !registrations.includes(member.user.id))
                    .filter((member) => member.roles.cache.find((role) => worldRoleNames.includes(role.name)) !== undefined)
                    .sort()
            )
            .then(async (value) => {
                const result = `Found ${value.size}:\n` + value.map((value1) => value1.toString()).join("\n");

                for (const split of splitMessage(result)) {
                    await message.reply(split);
                }
            });
    }
}
