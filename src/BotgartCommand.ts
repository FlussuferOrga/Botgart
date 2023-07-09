import * as akairo from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { BotgartClient } from "./BotgartClient";
import { getConfig } from "./config/Config";
import * as L from "./Locale";
import { logger } from "./util/Logging";

interface BotgartCommandOptionsNullable {
    availableAsDM?: boolean;
    cronable?: boolean;
    everyonePermission?: number;
    enabled?: boolean;
}

interface BotgartCommandOptions {
    availableAsDM: boolean;
    cronable: boolean;
    everyonePermission: number;
    enabled: boolean;
}

const LOG = logger();

export class BotgartCommand extends akairo.Command {
    protected availableAsDM: boolean;
    protected cronable: boolean;
    protected everyonePermission: number;
    protected enabled: boolean;
    protected cmdargs: akairo.ArgumentOptions[] | akairo.ArgumentGenerator;

    /**
     * Constructor
     * @param id - unique identifier
     * @param options - options for the Akairo Command
     * @param botgartOptions - additional options for the Botgart Command. Defaults are:
     *                        availableAsDM: false
     *                        cronable: false
     *                        everyonePermission: 0
     */
    constructor(id: string, options: akairo.CommandOptions, botgartOptions?: BotgartCommandOptionsNullable) {
        super(id, options);
        if (!options.aliases?.includes(id)) {
            LOG.warn(`Command ${id} is missing the command identity within the aliases`);
        }
        const defaults: BotgartCommandOptions = {
            availableAsDM: false,
            cronable: false,
            everyonePermission: 0,
            enabled: true,
        };
        const settings: BotgartCommandOptions = botgartOptions === undefined ? defaults : { ...defaults, ...botgartOptions };
        this.availableAsDM = settings.availableAsDM;
        this.cronable = settings.cronable;
        this.everyonePermission = settings.everyonePermission;
        this.cmdargs = options.args === undefined ? [] : options.args;
        this.enabled = settings.enabled;
    }

    /**
     * @returns the internal client, cast to BotgartClient, because that is needed in every other routine.
     */
    protected getBotgartClient(): BotgartClient {
        return this.client as BotgartClient;
    }

    /**
     * @returns this commands name in capitalisedsnake case.
     *          Eg. MyCool2Command becomes MY_COOL2_COMMAND.
     *          Useful for generating default locale keys.
     */
    protected snakeCaseName(): string {
        const match: string | undefined = this.constructor.name
            .match(/([A-Z][a-z0-9]*)/g)
            ?.map((t) => t.toUpperCase())
            .join("_");
        return match === undefined ? this.constructor.name : match;
    }

    protected helptextKey(): string {
        return `HELPTEXT_${this.snakeCaseName()}`;
    }

    protected descriptionKey(): string {
        return `DESC_${this.snakeCaseName()}`;
    }

    protected cooldownKey(): string {
        return `COOLDOWN_${this.snakeCaseName()}`;
    }

    /**
     * Checks whether a user is allowed to execute a command.
     * That's the case if either the user is the bot owner (set in config)
     * or when the sum of permissions granted to the user personally,
     * or all the rules the user has is greater than zero. Example:
     * User A has two roles R and S. User A has 0 permission power on command C.
     * The roles R and S have -5 and 10 permission power on C respetctivly.
     * The special role everyone has permission power 1.
     * In sum, A has: 0 + (-5) + 10 + 1 = 6 permission power. So they will
     * be allowed to execute C.
     * Note that this check takes place _in addition_ to the Akairo check
     * userPermissions and clientPermissions, which is very limited as it
     * is bound to the boolean permissions Discord gives out
     * (i.e. "user is admin", "user can use external emotes" etc...).
     * Those three checks are logically conjuncted with AND, so they must all pass.
     * @param user - the user for which to check the permissions.
     * @returns - true, if this function thinks the user is allowed to execute the command.
     *
     */
    public async isAllowed(user: discord.GuildMember | discord.User) {
        if (!this.isEnabled()) {
            return false;
        }

        if (this.isOwner(user)) {
            return true;
        }

        const userId = user.id;
        const guildId = user instanceof discord.GuildMember ? user.guild.id : undefined;
        const roles = user instanceof discord.GuildMember ? user.roles.cache.map((r) => r.id) : [];
        const [allowed, perm] = await this.getBotgartClient().commandPermissionRepository.checkPermission(this.id, userId, roles, guildId);
        return allowed || perm + this.everyonePermission > 0;
    }

    /**
     * Checks, if the passed user is an owner.
     * Owners are identified by their discord id (string of digits).
     * Multiple owners can be assigned in the config.
     * Users are allowed to execute every command.
     * @param user - the user to check.
     * @returns - true, if the user is an owner.
     */
    public isOwner(user: discord.GuildMember | discord.User) {
        const ownerIds = getConfig().get().owner_ids;
        return Array.isArray(ownerIds) && ownerIds.includes(user.id);
    }

    /**
     * Creates a decription for this command for help-listing.
     * Note that "description" is already taken somehow.
     * @returns - description of this command.
     */
    public desc() {
        return L.get(this.descriptionKey(), [], "\n");
    }

    /**
     * Creates a usage for this command for help-listing.
     * @returns - helptext of this command.
     */
    public usage() {
        return L.get(this.helptextKey(), [], "\n");
    }

    /**
     * Creates a cooldown message for this command.
     * Note that since most commands have no cooldown,
     * creating a message for each command does not make sense.
     * The default implementation passes the remaining seconds to the template string.
     * @param message: the original message that triggered the cooldown.
     * @param remaining: remaining milliseconds, until the command can be used again.
     * @returns a message specifying what is wrong.
     */
    public cooldownMessage(message: discord.Message, remaining: number) {
        return L.get(this.cooldownKey(), ["" + Math.ceil(remaining / 1000)]);
    }

    /**
     * Checks the arguments of exec() for validity.
     * Having valid arguments should return undefined
     * (default behaviour), while missing or malformed
     * arguments should result in an error message.
     * This method will be called by cronjobs to validate
     * that commands are executed with proper arguments.
     * The default implementation will check that every argument
     * defined in the args list is not undefined.
     * Commands where undefined (optional) arguments are allowed
     * or other checks must be enforced should override this
     * function or concatenate it with super.checkArgs(args).
     * @param {Object} args - arguments to the command.
     * @returns {String} error-string in case of malformed args, else undefined.
     */
    public checkArgs(args: Record<string, unknown>): string | undefined {
        let argsPresent: boolean = args !== undefined;
        let i = 0;
        while (argsPresent && i < this.cmdargs.length) {
            const arg = args[this.cmdargs[i].id];
            argsPresent = arg !== undefined && arg !== "" && arg !== null;
            i++;
        }
        if (!argsPresent) {
            LOG.debug(`Missing argument at position [${i - 1}] for command '${this.constructor.name}'.`);
        }
        return argsPresent ? undefined : this.usage();
    }

    /**
     * This is the method that should actually do the whole execution.
     * Ideally, exec() just calls this without doing anything else.
     * That's important to make Commands seemlessly available through
     * cronjobs, where no context like a Message is available.
     * Discord objects like Guilds and Channels should also be resolved
     * within this method to verify that they still exist.
     * A user could have scheduled a cronjob a week before and since then
     * the bot may have been kicked from the Guild or the channel could have
     * been deleted.
     * @param {Message} message - Message that triggered this command.
     If the command is run as a cron, this parameter will be null.
     Each command must check the validity of this parameter themselves if needed.
     * @param {User} responsible - the User responsible for this command.
     Either caller or whoever created the cronjob this command is running in.
     Note the this could fail to resolve and should always be checked for null.
     * @param {Guild} guild - the Guild on which to execute the command.
     * @param {map} args - arguments for the command. Each command specifies the format themselves.
     */
    public async command(
        message: discord.Message | null,
        responsible: discord.User | null,
        guild: discord.Guild | null,
        args: Record<string, unknown>
    ): Promise<unknown> {
        throw new Error("command() not implemented.");
    }

    /**
     * Serialises a map of command arguments to a string for store
     * it properly in the database.
     * In many cases, the default implementation will suffice.
     * But when complex objects from discord.js with cycles will not fit comfortably
     * into the DB, so we only store their ID. Each command will have to manually
     * do that additional work.
     * NOTE: serialiseArgs may _not_ modify the arguments by reference!
     * @param {Map} args - arguments to serialise to the DB.
     * @returns {string} - the serialised args
     */
    public serialiseArgs(args: Record<string, unknown>): string {
        return JSON.stringify(args);
    }

    /*
     * Inverse to serialiseArgs. Has to revert everything that was done there.
     * @param {string} jsonargs - serialised JSON arguments for the command.
     *                 NOTE: deserialiseArgs may _not_ modify the arguments by reference!
     * @returns {Map} the deserialised arguments.
     */
    public deserialiseArgs(jsonargs: string): Record<string, unknown> {
        return JSON.parse(jsonargs);
    }

    /**
     * Default implementation of Command.exec() for cron-able commands:
     *
     * 1. Deny DM-execution (if the command is not available as DM, which most are not).
     * 2. Check, if the arguments are not only syntactically, but semantically correct, if not, error out.
     * 3. Call command().
     * 4. Call postExecHook() with the result of command()
     *
     * Whereas croned commands only call command() and nothing else.
     *
     * This behaviour can of course be overridden on a case-to-case basis.
     *
     * @param {Message} message - message that triggered this command.
     * @param {Object} args - parameters.
     */
    public async exec(message: discord.Message, args: Record<string, unknown>): Promise<void> {
        if (!this.availableAsDM && !message.member && message.util) {
            await message.reply(L.get("NOT_AVAILABLE_AS_DM"));
            return;
        }

        const causer = message.member || message.author;
        if (!(await this.isAllowed(causer))) {
            await message.reply(L.get("NOT_PERMITTED"));
            return;
        }

        const errorMessage = this.checkArgs(args);
        if (errorMessage && message.util) {
            await message.reply(errorMessage);
            return;
        }

        const res = await this.command(message, message.author, message.guild, args);
        return this.postExecHook(message, args, res);
    }

    /**
     * Optional method that is called in the default implementation of exec().
     * This is useful for when directly invoking this command on a server should
     * have slightly different behaviour than doing it from a cron (eg giving the user feedback).
     * @param {Message} message - the Message as passed to exec().
     * @param {Map} args - the arguments as passed to exec().
     * @param {any} result - the result from command().
     * @returns {any} - is returned to the caller.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public postExecHook(message: discord.Message, args: Record<string, unknown>, result: unknown): void {}

    /*
     * Convenience method to reply from within a command.
     * If a message is present, the bot will reply to where
     * the message was received.
     * Else, it will send a DM to the responsible person.
     * This is relevent when a command is scheduled as cron
     * where a message to reply to is not available.
     * @param {Message} message - the message to reply to, may be null.
     * @param {User} responsible - the person responsible for the execution of the command.
     * @param response - the message text to send to the user.
     * @returns {Promise} - the promise for whichever method was executed.
     */
    public async reply(message: discord.Message, responsible: discord.User, response: string): Promise<discord.Message | discord.Message[]> {
        if (message) {
            return message.reply(response);
        } else {
            return responsible.send(response);
        }
    }

    public isEnabled() {
        return this.enabled;
    }
}
