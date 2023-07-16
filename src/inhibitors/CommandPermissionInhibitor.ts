import { AkairoMessage, Command, Inhibitor } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { logger } from "../util/Logging";
import { UseRequestContext } from "@mikro-orm/core";
import discord, { APIInteractionGuildMember, GuildMember, Message, User } from "discord.js";
import { BotgartCommand } from "../BotgartCommand";

const LOG = logger();

export class CommandPermissionInhibitor extends Inhibitor {
    constructor() {
        super("commandPermission", {
            type: "post", //post parse
            priority: 10,
            reason: "Insufficient Permissions",
        });
    }

    @UseRequestContext((type: Inhibitor) => (type.client as BotgartClient).orm)
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

module.exports = CommandPermissionInhibitor;
