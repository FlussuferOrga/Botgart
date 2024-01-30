import { Command, CommandHandler, CommandHandlerOptions } from "@notenoughupdates/discord-akairo";
import { ChatInputCommandInteraction, Message } from "discord.js";
import { CreateRequestContext } from "@mikro-orm/core";
import { BotgartClient } from "./BotgartClient.js";
import { Duration } from "luxon";
import { logger } from "./util/Logging.js";

const LOG = logger();

export class ExtendedCommandHandler extends CommandHandler {
    private intervalRef?: NodeJS.Timeout;

    constructor(client: BotgartClient, options: CommandHandlerOptions) {
        super(client, options);
        this.setupReregistration(options, client);
    }

    private setupReregistration(options: CommandHandlerOptions, client: BotgartClient) {
        if (options?.autoRegisterSlashCommands) {
            const duration = Duration.fromObject({ hours: 1 });
            LOG.debug("Starting InteractionCommandRefresh every " + duration.toString());

            this.intervalRef = setInterval(() => super.registerInteractionCommands(), duration.toMillis());
            client.on("shutdown", () => {
                if (this.intervalRef) {
                    LOG.debug("Stopping InteractionCommandRefresh");
                    clearInterval(this.intervalRef);
                    this.intervalRef = undefined;
                }
            });
        }
    }

    @CreateRequestContext((type: CommandHandler) => (type.client as BotgartClient).orm)
    handleDirectCommand(message: Message, content: string, command: Command, ignore?: boolean): Promise<boolean | null> {
        return super.handleDirectCommand(message, content, command, ignore);
    }

    @CreateRequestContext((type: CommandHandler) => (type.client as BotgartClient).orm)
    handleSlash(interaction: ChatInputCommandInteraction): Promise<boolean | null> {
        return super.handleSlash(interaction);
    }
}
