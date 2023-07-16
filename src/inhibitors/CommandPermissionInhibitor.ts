import { AkairoMessage, Command, Inhibitor } from "@notenoughupdates/discord-akairo";
import { BotgartClient } from "../BotgartClient";
import { logger } from "../util/Logging";
import { UseRequestContext } from "@mikro-orm/core";
import { Message, User } from "discord.js";
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
            let causer: User = message.author;
            if (causer != undefined) {
                return !(await command.isAllowed(causer));
            } else {
                return true; //no author !
            }
        }
        return false;
    }
}

module.exports = CommandPermissionInhibitor;
