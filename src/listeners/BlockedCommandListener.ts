import { AkairoMessage, Command, Listener } from "@notenoughupdates/discord-akairo";
import * as L from "../Locale";
import { Message } from "discord.js";

export class BlockedCommandListener extends Listener {
    constructor() {
        super("BlockedResponse", {
            emitter: "commandHandler",
            event: "commandBlocked",
        });
    }


    async exec(message: Message<boolean> | AkairoMessage, command: Command, reason: string) {
        if (reason === "Insufficient Permissions") {
            await message.reply({
                content: L.get("NOT_PERMITTED"),
                ephemeral: true,
            });
        } else {
            await message.reply({
                content: reason,
                ephemeral: true,
            });
        }
    }
}

module.exports = BlockedCommandListener;
