import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { Guild, GuildChannel, ThreadChannel } from "discord.js";
import { BotgartCommand } from "./BotgartCommand.js";
import { RosterService } from "./commands/resetlead/RosterService.js";
import { getConfig } from "./config/Config.js";
import { CommandPermissionRepository } from "./repositories/CommandPermissionRepository.js";
import { CronJobRepository } from "./repositories/CronJobRepository.js";
import { FaqRepository } from "./repositories/FaqRepository.js";
import { FishingRepository } from "./repositories/FishingRepository.js";
import { LogChannelRepository } from "./repositories/LogChannelRepository.js";
import { PermanentRoleRepository } from "./repositories/PermanentRoleRepository.js";
import { RegistrationRepository } from "./repositories/RegistrationRepository.js";
import { RosterRepository } from "./repositories/RosterRepository.js";
import { CronJobService } from "./services/CronJobService.js";
import { RevalidationService } from "./services/RevalidationService.js";
import { TagBroadcastService } from "./services/TagBroadcastService.js";
import { ValidationService } from "./services/ValidationService.js";
import { CommanderPoller } from "./CommanderPoller.js";
import { logger } from "./util/Logging.js";
import { AkairoClientOptions } from "@notenoughupdates/discord-akairo";
import { MikroORM } from "@mikro-orm/core";
import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";
import { ExtendedCommandHandler } from "./ExtendedCommandHandler.js";
import { CommanderStorage } from "./Commanders.js";
import { fileURLToPath } from "url";
import path from "path";
import { CommandersApi, Configuration, GuildsApi, RegistrationApi, ResetrosterApi } from "./generated/api/botgerda/index.js";
import { Duration } from "luxon";

const LOG = logger();
const AKAIRO_LOG = logger({ file: "akairoDebug" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    public readonly commanderPoller: CommanderPoller;
    public readonly commanders: CommanderStorage;

    public readonly commandHandler: ExtendedCommandHandler;
    public readonly listenerHandler: akairo.ListenerHandler;
    public readonly inhibitorHandler: akairo.InhibitorHandler;
    public readonly orm: MikroORM<BetterSqliteDriver>;

    public readonly commandersApi: CommandersApi;
    public readonly guildsApi: GuildsApi;
    public readonly registrationApi: RegistrationApi;
    public readonly resetrosterApi: ResetrosterApi;

    constructor(options: AkairoClientOptions, clientOptions: discord.ClientOptions, orm: MikroORM<BetterSqliteDriver>) {
        super(options, clientOptions);
        this.on("akairoDebug", (args) => {
            AKAIRO_LOG.info(args);
        });

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
        this.commanderPoller = new CommanderPoller(this);

        // noinspection HttpUrlsUsage
        const basePath = `http://${getConfig().get().ts_listener.ip}:${getConfig().get().ts_listener.port}`;
        const configuration = new Configuration({ basePath: basePath });
        this.commandersApi = new CommandersApi(configuration);
        this.guildsApi = new GuildsApi(configuration);
        this.registrationApi = new RegistrationApi(configuration);
        this.resetrosterApi = new ResetrosterApi(configuration);

        this.inhibitorHandler = new akairo.InhibitorHandler(this, {
            directory: path.join(__dirname, "inhibitors"),
        });

        this.listenerHandler = new akairo.ListenerHandler(this, {
            directory: path.join(__dirname, "listeners"),
        });

        const prefix = getConfig().get().prefix;
        this.commandHandler = new ExtendedCommandHandler(this, {
            directory: path.join(__dirname, "commands"),
            prefix: prefix,
            commandUtil: true,
            commandUtilLifetime: 600000,
            autoRegisterSlashCommands: true,
            autoDefer: true,
        });

        //workaround. Interaction commands are getting deleted every now and then..

        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);

        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler,
        });

        this.inhibitorHandler
            .loadAll()
            .then((value) => LOG.info("Loaded"))
            .catch((reason) => LOG.error("Error: %s", reason));
        this.listenerHandler
            .loadAll()
            .then((value) => LOG.info("Loaded"))
            .catch((reason) => LOG.error("Error: %s", reason));
        this.commandHandler
            .loadAll()
            .then((value) => LOG.info("Loaded"))
            .catch((reason) => LOG.error("Error: %s", reason));

        this.commandHandler.on("cooldown", (message: discord.Message, command: akairo.Command, remaining: number) => {
            if (command instanceof BotgartCommand) {
                const mes: string = command.cooldownMessage(message, remaining);
                if (mes) {
                    message.reply(mes);
                }
            }
        });
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
            LOG.debug("Expected channel for type '%s' was not found in guild '%s' to discord-log message: '%s'.", type, guild.name, message);
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
        this.emit("shutdown");
        if (this.token !== null) {
            // is logged in
            LOG.info("Preparing Shutdown");
            await this.tagBroadcastService.tagDownAllBroadcastsForShutdown();
        }
    }

    public currentGuilds(): IterableIterator<Guild> {
        return this.guilds.valueOf().values();
    }
}
