import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient.js";
import { BotgartCommand } from "../BotgartCommand.js";
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

        let managedRoles = cl.validationService.collectAllManagedRoles(guild);

        guild.members
            .fetch()
            .then(async (members) =>
                members
                    .filter((member) => !member.user.bot)
                    .filter((member) => !registrations.includes(member.user.id))
                    .map((member) => {
                        let unauthorizedRoles = member.roles.cache.filter((role) => managedRoles.includes(role)).map((value) => value.name);
                        return { member, unauthorizedRoles };
                    })
                    .filter((v) => v.unauthorizedRoles.length > 0)
                    .sort()
            )
            .then(async (value) => {
                const result = `Found ${value.length}:\n` + value.map((hit) => `${hit.member}: ${hit.unauthorizedRoles.join(",")}`).join("\n");

                for (const split of splitMessage(result)) {
                    await message.reply(split);
                }
            });
    }
}
