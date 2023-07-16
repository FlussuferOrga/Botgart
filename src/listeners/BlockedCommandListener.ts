import { AkairoMessage, Command, Listener } from "@notenoughupdates/discord-akairo";
import * as L from "../Locale";
import { Message } from "discord.js";
import { BuiltInReasons } from "@notenoughupdates/discord-akairo/dist/src/util/Constants";

export class BlockedCommandListener extends Listener {
    constructor() {
        super("BlockedResponse", {
            emitter: "commandHandler",
            event: "commandBlocked",
        });
    }

    async exec(message: Message<boolean> | AkairoMessage, command: Command, reason: string) {
        await message.reply({
            content: this.getReasonText(reason),
            ephemeral: true,
        });
    }

    private getReasonText(reason: string) {
        switch (reason) {
            case BuiltInReasons.GUILD:
                return L.get("NOT_AVAILABLE_AS_DM");
            case BuiltInReasons.DM:
                return L.get("NOT_AVAILABLE_AS_GUILD");
            case BuiltInReasons.OWNER:
            case BuiltInReasons.SUPER_USER:
            case BuiltInReasons.BOT:
            case BuiltInReasons.CLIENT:
            case "Insufficient Permissions":
                return L.get("NOT_PERMITTED");
            default:
                return "Could run command: " + reason;
        }
    }
}

module.exports = BlockedCommandListener;
