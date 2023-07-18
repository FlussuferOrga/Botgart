import { Command, CommandHandler, CommandHandlerOptions } from "@notenoughupdates/discord-akairo";
import { ChatInputCommandInteraction, Message } from "discord.js";
import { UseRequestContext } from "@mikro-orm/core";
import { BotgartClient } from "./BotgartClient.js";

export class ExtendedCommandHandler extends CommandHandler {
    constructor(client: BotgartClient, options: CommandHandlerOptions) {
        super(client, options);
    }

    @UseRequestContext((type: CommandHandler) => (type.client as BotgartClient).orm)
    handleDirectCommand(message: Message, content: string, command: Command, ignore?: boolean): Promise<boolean | null> {
        return super.handleDirectCommand(message, content, command, ignore);
    }

    @UseRequestContext((type: CommandHandler) => (type.client as BotgartClient).orm)
    handleSlash(interaction: ChatInputCommandInteraction): Promise<boolean | null> {
        return super.handleSlash(interaction);
    }
}
