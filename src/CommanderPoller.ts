import * as discord from "discord.js";
import { Guild } from "discord.js";
import events from "events";
import { BotgartClient } from "./BotgartClient.js";
import { getConfig } from "./config/Config.js";
import { logger } from "./util/Logging.js";
import { UseRequestContext } from "@mikro-orm/core";
import { Registration } from "./mikroorm/entities/Registration.js";
import { Commander, CommanderState } from "./Commanders.js";
import { DateTime } from "luxon";

const LOG = logger();

// after failing to reconnect to TS after losing connection once this many times,
// all ongoing raids will be terminated to avoid commanders being credited for seemingly extremely
// long raids after the TS bot has been unreachable for a prolonged time, althrough they have long
// since tagged down.
const RECONNECT_PATIENCE = 10;

/**
 * This class listens for changes in the commander list.
 * That is, it reacts to when a commander tags up or down in Teamspeak.
 * Doing so will throw two events "tagup" and "tagdown".
 * The latter will be thrown _after_ the ended lead has been written to the DB.
 */
export class CommanderPoller extends events.EventEmitter {
    private readonly commanderRole: string;
    private readonly userDelay: number;
    private readonly gracePeriod: number;
    private patience: number;

    constructor(private readonly botgartClient: BotgartClient) {
        super();

        const config = getConfig().get();
        this.commanderRole = config.ts_listener.commander_role;
        this.userDelay = config.ts_listener.user_delay;
        this.gracePeriod = config.ts_listener.grace_period;
        this.patience = RECONNECT_PATIENCE;
        this.setMaxListeners(24);
        setInterval(() => this.checkCommanders(), config.ts_commander_check_interval);
    }

    @UseRequestContext((type: CommanderPoller) => type.botgartClient.orm)
    private async checkCommanders(): Promise<void> {
        LOG.verbose("Requesting commanders from TS-Bot.");
        const now: DateTime = DateTime.utc();
        try {
            let commandersList = (await this.botgartClient.commandersApi.commandersList()).commanders;
            // const res: string = await this.ts3connection.get("commanders");
            const data = { commanders: commandersList! };
            const commanderTSUIDs: string[] = data.commanders.map((c) => c.tsCluid!);
            LOG.verbose(`Commanders that are still active: ${JSON.stringify(commanderTSUIDs)}`);
            const taggedDown: Commander[] = this.botgartClient.commanders.getTaggedDown(new Set<string>(commanderTSUIDs));
            if (taggedDown.length > 0) {
                LOG.debug("Tagging down", { commanders: taggedDown });
            }
            this.botgartClient.guilds.cache.forEach((g) => {
                data.commanders.forEach((c) => {
                    const account = c.accountName; // for lookup
                    const uid = c.tsCluid; // for this.users
                    const username = c.tsDisplayName; // for broadcast
                    const channel = c.tsChannelName; // for broadcast and this.channels
                    const channel_path = c.tsChannelPath; // for broadcast and this.channels
                    const ts_join_url = c.tsJoinUrl; // for broadcast and this.channels
                    const type = c.leadtype || "UNKNOWN";

                    let commander = this.botgartClient.commanders.getCommanderByTS3UID(uid);
                    if (commander === undefined) {
                        // user was newly discovered as tagged up -> save user without cooldown
                        commander = new Commander(account, username, uid, channel, channel_path, ts_join_url);
                        commander.setState(CommanderState.TAG_UP); // happens in constructor too, but for clarity
                        this.botgartClient.commanders.addCommander(commander);
                        LOG.debug(`Moving newly discovered ${username} to TAG_UP state.`);
                    }

                    const elapsed = now.valueOf() - commander.getLastUpdate().valueOf();
                    switch (commander.getState()) {
                        case CommanderState.TAG_UP:
                            // user tagged up and is waiting to gain commander status
                            if (elapsed > this.gracePeriod) {
                                commander.setLastUpdate(now);
                                commander.setRaidStart(now);
                                commander.setState(CommanderState.COMMANDER);
                                commander.setTS3Channel(channel);
                                commander.setTs3channelPath(channel_path);
                                commander.setCurrentLeadType(type);
                                this.tagUp(g, commander);
                                LOG.debug(`Moving ${username} from TAG_UP to COMMANDER state.`);
                            }
                            break;

                        case CommanderState.COOLDOWN:
                            // user tagged up again too quickly -> wait out delay and then go into TAG_UP
                            if (elapsed > this.userDelay) {
                                commander.setLastUpdate(now);
                                commander.setState(CommanderState.TAG_UP);
                                LOG.debug(`Moving ${username} from COOLDOWN to TAG_UP state.`);
                            }
                            break;

                        case CommanderState.TAG_DOWN:
                            // user raided before, but tagged down in between
                            // -> if they waited long enough, go into TAG_UP, else sit out COOLDOWN
                            if (elapsed > this.userDelay) {
                                commander.setLastUpdate(now);
                                commander.setState(CommanderState.TAG_UP);
                                LOG.debug(`Moving ${username} from TAG_DOWN to TAG_UP state.`);
                            } else {
                                commander.setState(CommanderState.COOLDOWN);
                                LOG.debug(`Moving ${username} from TAG_DOWN to COOLDOWN state.`);
                            }
                            break;

                        case CommanderState.COMMANDER:
                            // still raiding -> update timestamp
                            commander.setLastUpdate(now);
                            commander.setCurrentLeadType(type);
                            commander.setTS3Channel(channel);
                            commander.setTs3channelPath(channel_path);
                            this.tagUpdate(g, commander);
                            break;
                    }
                });
                taggedDown.forEach((commander: Commander) => {
                    commander.setLastUpdate(now);
                    commander.setState(CommanderState.TAG_DOWN);
                    commander.setRaidEnd(now);
                    this.tagDown(g, commander);
                    LOG.debug(`Moving ${commander.getTS3ClientUID()} from COOLDOWN, TAG_UP, or COMMANDER to TAG_DOWN state.`);
                });
            });
            this.patience = RECONNECT_PATIENCE;
        } catch (ex) {
            LOG.error(`Could not retrieve active commanders:`, { err: ex });
            // by going as low -1 we do not get an underflow by going indefinitely low
            // but we do the reset only once (when reaching 0) instead of every time after reaching 0.
            this.patience = Math.max(this.patience - 1, -1);
            if (this.patience == 0) {
                LOG.warn(`Could not reconnect to TS after ${RECONNECT_PATIENCE} tries. Tagging down all active commanders.`);
                this.botgartClient.commanders
                    .getAllCommanders()
                    .filter((commander) => commander.getDiscordMember() !== undefined)
                    .map((commander) => this.botgartClient.guilds.cache.map((g) => this.tagDown(g, commander)));
            }
        }
    }

    /**
     * Makes a user tag up in a Discord-guild. That means:
     * - the raid is being announced in the dedicated channel (if that channel exists)
     * - if the user is not just in TS, but also in Discord, he will gain the commander status there
     * - a mapping of the TS-UID to the Discord-username is created
     */
    private async tagUp(g: discord.Guild, commander: Commander) {
        LOG.info(`Tagging up ${commander.getTS3DisplayName()} in ${g.name}.`);
        let registration: Registration | null = null;
        if (commander.getAccountName() !== null) {
            registration = await this.botgartClient.registrationRepository.getUserByAccountName(commander.getAccountName()!);
        }

        let duser: discord.GuildMember | undefined;
        if (registration !== null) {
            commander.setRegistration(registration);
            // the commander is member of the current discord -> give role
            duser = await g.members.fetch(registration.user); // cache.find(m => m.id === registration.user);
            if (duser === undefined) {
                LOG.warn(
                    `Tried to find GuildMember for user with registration ID ${registration.user}, but could not find any. Maybe this is a caching problem?`
                );
            }
            commander.setDiscordMember(duser);

            await this.tagUpAssignRole(g, commander);
        }

        await this.botgartClient.tagBroadcastService
            .sendTagUpBroadcast(g, commander)
            .then((value) => commander.setBroadcastMessage(value))
            .catch((e) => LOG.error("Could send tag up broadcast", e));

        this.emit("tagup", {
            guild: g,
            commander: commander,
            dbRegistration: registration,
        });
    }

    /**
     * Makes the user tag down in a Discord-guild. That is:
     * - the role is removed from the user if he is present in the Discord
     * - the user's TS-UID-Discordname is forgotten
     */
    private async tagDown(g: discord.Guild, commander: Commander) {
        let registration: Registration | null = null;
        if (commander.getAccountName() !== null) {
            registration = await this.botgartClient.registrationRepository.getUserByAccountName(commander.getAccountName()!);
        }

        try {
            await this.botgartClient.tagBroadcastService.tagDownBroadcast(commander);
        } catch (e) {
            LOG.error("Could not close broadcast on tagdown", e);
        }

        if (registration !== null) {
            try {
                await this.tagDownRemoveRole(g, await g.members.fetch(registration.user));
            } catch (e) {
                LOG.error("Could not unassign commander role from user", e);
            }

            LOG.debug("Done processing commander. Will now send out tagdown event.");
        }

        this.botgartClient.commanders.deleteCommander(commander);
        this.emit("tagdown", {
            guild: g,
            commander: commander,
            dbRegistration: registration,
        });
    }

    private async tagUpdate(g: Guild, commander: Commander) {
        await this.botgartClient.tagBroadcastService.tagUpdateBroadcast(g, commander);
    }

    private async tagUpAssignRole(g: discord.Guild, commander: Commander) {
        const crole = g.roles.cache.find((r) => r.name === this.commanderRole);
        if (crole && commander.getDiscordMember()) {
            await commander
                .getDiscordMember()
                ?.roles.add(crole)
                .catch((e) =>
                    LOG.warn(
                        `Could not remove role '${this.commanderRole}' from ` +
                            `user '${(commander.getDiscordMember() as discord.GuildMember).displayName}'`,
                        e
                    )
                );
        }
    }

    private async tagDownRemoveRole(g: discord.Guild, dmember: discord.GuildMember | undefined) {
        // the commander is member of the current discord -> remove role
        // since removing roles has gone wrong a lot lately,
        // we're updating the cache manually
        // https://discord.js.org/#/docs/main/stable/class/RoleManager?scrollTo=fetch
        const crole: discord.Role | undefined = (await g.roles.fetch()).find((r) => r.name === this.commanderRole);
        if (crole && dmember) {
            LOG.info(`Tagging down ${dmember.displayName} in ${g.name}, will remove their role ${crole}.`);
            await dmember.roles
                .remove(crole)
                .catch((e) =>
                    LOG.warn(
                        `Could not remove role '${this.commanderRole}' from user ` +
                            `'${(dmember as discord.GuildMember).displayName}' which was expected to be there.` +
                            ` Maybe someone else already removed it. ${e}`
                    )
                );

            LOG.debug("Done managing roles for former commander.");
        }
    }
}
