import { AkairoClient, Command, CommandHandler, CommandHandlerOptions } from "@notenoughupdates/discord-akairo";
import { ChatInputCommandInteraction, Message } from "discord.js";
import { MikroORM, UseRequestContext } from "@mikro-orm/core";

export class ExtendedCommandHandler extends CommandHandler {
    private orm: MikroORM;

    constructor(client: AkairoClient, options: CommandHandlerOptions, orm: MikroORM) {
        super(client, options);
        this.orm = orm;
    }

    @UseRequestContext()
    handleDirectCommand(message: Message, content: string, command: Command, ignore?: boolean): Promise<boolean | null> {
        return super.handleDirectCommand(message, content, command, ignore);
    }

    @UseRequestContext()
    handleSlash(interaction: ChatInputCommandInteraction): Promise<boolean | null> {
        return super.handleSlash(interaction);
    }
}
