import { AkairoMessage, Command, Inhibitor } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient.js";
import { CreateRequestContext } from "@mikro-orm/core";
import { GuildMember, Message } from "discord.js";
import { BotgartCommand } from "../BotgartCommand.js";

export default class CommandPermissionInhibitor extends Inhibitor {
    constructor() {
        super("commandPermission", {
            type: "post", //post parse
            priority: 10,
            reason: "Insufficient Permissions",
        });
    }

    @CreateRequestContext((type: Inhibitor) => (type.client as BotgartClient).orm)
    async exec(message: Message | AkairoMessage, command?: Command): Promise<boolean> {
        if (command instanceof BotgartCommand) {
            if (message.member !== null) {
                if (message.member instanceof GuildMember) {
                    //command
                    return !(await command.isAllowedMember(message.member));
                } else {
                    return !(await command.isAllowedApiMember(message.member, message.guildId!));
                }
            } else {
                return !(await command.isAllowedUser(message.author));
            }
        }
        return false;
    }
}
