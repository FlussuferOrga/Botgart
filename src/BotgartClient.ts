import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { GuildChannel, ThreadChannel } from "discord.js";
import { BotgartCommand } from "./BotgartCommand";
import { RosterService } from "./commands/resetlead/RosterService";
import { getConfig } from "./config/Config";
import { Database } from "./database/Database";
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
import { CommanderStorage, TS3Connection } from "./TS3Connection";
import { TS3Listener } from "./TS3Listener";
import { logger } from "./util/Logging";
import { AkairoClientOptions } from "@notenoughupdates/discord-akairo";

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

    constructor(options: AkairoClientOptions, clientOptions: discord.ClientOptions, db: Database) {
        super(options, clientOptions);

        // Repositories
        this.fishingRepository = new FishingRepository(db);
        this.registrationRepository = new RegistrationRepository(db);
        this.rosterRepository = new RosterRepository(db);
        this.cronJobRepository = new CronJobRepository(db);
        this.faqRepository = new FaqRepository(db);
        this.permanentRoleRepository = new PermanentRoleRepository(db);
        this.commandPermissionRepository = new CommandPermissionRepository(db);
        this.logChannelRepository = new LogChannelRepository(db);

        this.cronJobService = new CronJobService(this.cronJobRepository, this);
        this.rosterService = new RosterService(this.rosterRepository, this);
        this.tagBroadcastService = new TagBroadcastService(this);
        this.validationService = new ValidationService(this);
        this.revalidationService = new RevalidationService(this);

        this.commanders = new CommanderStorage();
        this.ts3listener = new TS3Listener(this);

        this.ts3connection = new TS3Connection(getConfig().get().ts_listener.ip, getConfig().get().ts_listener.port, "MainConnection");

        const prefix = getConfig().get().prefix;
        this.commandHandler = new akairo.CommandHandler(this, {
            directory: __dirname + "/commands/",
            prefix: prefix,
            commandUtil: true,
            commandUtilLifetime: 600000,
            autoRegisterSlashCommands: true,
        });
        this.commandHandler.loadAll();

        this.commandHandler.on("cooldown", (message: discord.Message, command: akairo.Command, remaining: number) => {
            if (command instanceof BotgartCommand) {
                const mes: string = command.cooldownMessage(message, remaining);
                if (mes) {
                    message.reply(mes);
                }
            }
        });

        this.listenerHandler = new akairo.ListenerHandler(this, {
            directory: __dirname + "/listeners/",
        });
        this.listenerHandler.loadAll();

        this.inhibitorHandler = new akairo.InhibitorHandler(this, {
            directory: __dirname + "/inhibitors/",
        });
        this.inhibitorHandler.loadAll();
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
    public discordLog(guild: discord.Guild, type: string, message: string, disposable = true) {
        const channels: string[] = this.logChannelRepository.getLogChannels(guild, type);
        if (channels.length === 0 && !disposable) {
            LOG.debug(
                "Expected channel for type '{0}' was not found in guild '{1}' to discord-log message: '{2}'.".formatUnicorn(type, guild.name, message)
            );
        } else {
            channels.forEach((cid) => {
                const channel: GuildChannel | ThreadChannel | undefined = guild.channels.cache.find((c) => c.id === cid);
                if (!channel) {
                    LOG.error(
                        `Channel for type '${type}' for guild '${guild.name}' is set to channel '${cid}' in the DB, but no longer present in the guild. Skipping.`
                    );
                } else if (!(channel instanceof discord.TextChannel)) {
                    LOG.error(
                        `Channel '${cid}' in guild '${guild.name}' to log type '${type}' was found, but appears to be a voice channel. Skipping.`
                    );
                } else {
                    (channel as discord.TextChannel).send(message);
                }
            });
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
