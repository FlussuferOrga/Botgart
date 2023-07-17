import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { GuildChannel, ThreadChannel } from "discord.js";
import { BotgartCommand } from "./BotgartCommand";
import { RosterService } from "./commands/resetlead/RosterService";
import { getConfig } from "./config/Config";
import { CommandPermissionRepository } from "./repositories/CommandPermissionRepository";
import { CronJobRepository } from "./repositories/CronJobRepository";
import { FaqRepository } from "./repositories/FaqRepository";
import { FishingRepository } from "./repositories/FishingRepository";
import { LogChannelRepository } from "./repositories/LogChannelRepository";
import { PermanentRoleRepository } from "./repositories/PermanentRoleRepository";
import { RegistrationRepository } from "./repositories/RegistrationRepository";
import { RosterRepository } from "./repositories/RosterRepository";
import { CronJobService } from "./services/CronJobService";
import { RevalidationService } from "./services/RevalidationService";
import { TagBroadcastService } from "./services/TagBroadcastService";
import { ValidationService } from "./services/ValidationService";
import { TS3Connection } from "./TS3Connection";
import { TS3Listener } from "./TS3Listener";
import { logger } from "./util/Logging";
import { AkairoClientOptions } from "@notenoughupdates/discord-akairo";
import { MikroORM } from "@mikro-orm/core";
import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";
import { ExtendedCommandHandler } from "./ExtendedCommandHandler";
import { CommanderStorage } from "./Commanders";

const LOG = logger();

export class BotgartClient extends akairo.AkairoClient {
    public fishingRepository: FishingRepository;
    public registrationRepository: RegistrationRepository;
    public rosterRepository: RosterRepository;
    public cronJobRepository: CronJobRepository;
    public faqRepository: FaqRepository;
    public permanentRoleRepository: PermanentRoleRepository;
    public commandPermissionRepository: CommandPermissionRepository;
    public logChannelRepository: LogChannelRepository;

    public cronJobService: CronJobService;
    public rosterService: RosterService;
    public tagBroadcastService: TagBroadcastService;
    public validationService: ValidationService;
    public revalidationService: RevalidationService;

    private readonly ts3connection: TS3Connection;
    public readonly ts3listener: TS3Listener;
    public readonly commanders: CommanderStorage;

    public readonly commandHandler: akairo.CommandHandler;
    public readonly listenerHandler: akairo.ListenerHandler;
    public readonly inhibitorHandler: akairo.InhibitorHandler;
    orm: MikroORM<BetterSqliteDriver>;

    constructor(options: AkairoClientOptions, clientOptions: discord.ClientOptions, orm: MikroORM<BetterSqliteDriver>) {
        super(options, clientOptions);
        this.orm = orm;

        // Repositories
        this.fishingRepository = new FishingRepository(orm);
        this.registrationRepository = new RegistrationRepository(orm);
        this.rosterRepository = new RosterRepository(orm);
        this.cronJobRepository = new CronJobRepository(orm);
        this.faqRepository = new FaqRepository(orm);
        this.permanentRoleRepository = new PermanentRoleRepository(orm);
        this.commandPermissionRepository = new CommandPermissionRepository(orm);
        this.logChannelRepository = new LogChannelRepository(orm);

        this.cronJobService = new CronJobService(this.cronJobRepository, orm, this);
        this.rosterService = new RosterService(this.rosterRepository, orm, this);
        this.tagBroadcastService = new TagBroadcastService(this);
        this.validationService = new ValidationService(this);
        this.revalidationService = new RevalidationService(this);

        this.commanders = new CommanderStorage();
        this.ts3listener = new TS3Listener(this);

        this.ts3connection = new TS3Connection(getConfig().get().ts_listener.ip, getConfig().get().ts_listener.port, "MainConnection");

        this.inhibitorHandler = new akairo.InhibitorHandler(this, {
            directory: __dirname + "/inhibitors/",
        });

        this.listenerHandler = new akairo.ListenerHandler(this, {
            directory: __dirname + "/listeners/",
        });

        const prefix = getConfig().get().prefix;
        this.commandHandler = new ExtendedCommandHandler(
            this,
            {
                directory: __dirname + "/commands/",
                prefix: prefix,
                commandUtil: true,
                commandUtilLifetime: 600000,
                autoRegisterSlashCommands: true,
                autoDefer: true,
            },
            orm
        );
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);

        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler,
        });

        this.inhibitorHandler.loadAll();
        this.listenerHandler.loadAll();
        this.commandHandler.loadAll();

        this.commandHandler.on("cooldown", (message: discord.Message, command: akairo.Command, remaining: number) => {
            if (command instanceof BotgartCommand) {
                const mes: string = command.cooldownMessage(message, remaining);
                if (mes) {
                    message.reply(mes);
                }
            }
        });
    }

    public getTS3Connection(): TS3Connection {
        return this.ts3connection;
    }

    /**
     * Logs a string to a Discord-text-channel. For each type, one or more channels
     * can be set. Types are arbitrary strings, making this feature far more
     * flexible than just log levels. In fact, it enables us to have each command
     * define an own "type" and have administrators define channels to which messages
     * of that type are being written to.
     * E.g. a ClockCommand could call
     *   discordLog(_, "clock", now())
     * every minute and define a connection between the "clock"-type and the channel #time in a guild.
     * That would cause now() to be written to #time every minute.
     * @param guild - guild for which the connection should be defined
     * @param type - arbitrary type
     * @param message - the message to log
     * @param disposable (optional, default: true) - if FALSE and no channel can be found to log the message, it will be written to the debug-log as fallback.
     */
    public async discordLog(guild: discord.Guild, type: string, message: string, disposable = true) {
        const channels: string[] = await this.logChannelRepository.getLogChannels(guild, type);
        if (channels.length === 0 && !disposable) {
            LOG.debug(
                "Expected channel for type '{0}' was not found in guild '{1}' to discord-log message: '{2}'.".formatUnicorn(type, guild.name, message)
            );
        } else {
            for (const cid of channels) {
                const channel: GuildChannel | ThreadChannel | null = await guild.channels.fetch(cid);
                if (!channel) {
                    LOG.error(
                        `Channel for type '${type}' for guild '${guild.name}' is set to channel '${cid}' in the DB, but no longer present in the guild. Skipping.`
                    );
                } else if (!(channel instanceof discord.TextChannel)) {
                    LOG.error(
                        `Channel '${cid}' in guild '${guild.name}' to log type '${type}' was found, but appears to be a voice channel. Skipping.`
                    );
                } else {
                    await (channel as discord.TextChannel).send(message);
                }
            }
        }
    }

    public async prepareShutdown() {
        if (this.token !== null) {
            // is logged in
            LOG.info("Preparing Shutdown");
            await this.tagBroadcastService.tagDownAllBroadcastsForShutdown();
        }
    }
}
