import * as discord from "discord.js";
import { Guild } from "discord.js";
import { BotgartClient } from "./BotgartClient.js";
import { getConfig } from "./config/Config.js";
import { logger } from "./util/Logging.js";
import { UseRequestContext } from "@mikro-orm/core";
import { Registration } from "./mikroorm/entities/Registration.js";
import { Commander, CommanderState } from "./Commanders.js";
import { DateTime, Duration } from "luxon";
import { Commander as ApiCommander } from "./generated/api/botgerda/models/index.js";

const LOG = logger();

// after failing to reconnect to TS after losing connection once this many times,
// all ongoing raids will be terminated to avoid commanders being credited for seemingly extremely
// long raids after the TS bot has been unreachable for a prolonged time, althrough they have long
// since tagged down.
const RECONNECT_PATIENCE = 10;

/**
 * This class listens for changes in the commander list.
 * That is, it reacts to when a commander tags up or down in Teamspeak.
 * The latter will be thrown _after_ the ended lead has been written to the DB.
 */
export class CommanderPoller {
    private readonly commanderRole: string;
    private readonly userDelay: Duration;
    private readonly gracePeriod: Duration;
    private patience: number;

    constructor(private readonly botgartClient: BotgartClient) {
        const config = getConfig().get();
        this.commanderRole = config.ts_listener.commander_role;
        this.userDelay = Duration.fromObject({ seconds: config.ts_listener.user_delay });
        this.gracePeriod = Duration.fromObject({ seconds: config.ts_listener.grace_period });
        this.patience = RECONNECT_PATIENCE;
        setInterval(() => this.checkCommanders(), config.ts_commander_check_interval);
    }

    private async checkCommanders(): Promise<void> {
        LOG.info("Starting Commander Update");

        let commanders: ApiCommander[];
        try {
            commanders = (await this.botgartClient.commandersApi.commandersList())?.commanders || [];
            LOG.info(`Commanders that are currently active based on TS response: ${JSON.stringify(commanders.map((c) => c.tsDisplayName!))}`);
        } catch (ex) {
            LOG.error(`Could not retrieve active commanders:`, { err: ex });
            // by going as low -1 we do not get an underflow by going indefinitely low
            // but we do the reset only once (when reaching 0) instead of every time after reaching 0.
            this.patience = Math.max(this.patience - 1, -1);
            if (this.patience == 0) {
                this.tagDownAllDueToMissingConnection();
            }
            return;
        }
        const taggedDown: Commander[] = this.botgartClient.commanders.getTaggedDown(new Set<string>(commanders.map((c) => c.tsCluid!)));
        if (taggedDown.length > 0) {
            LOG.debug("Tagging down", { commanders: taggedDown });
        }
        const now: DateTime = DateTime.now();
        for (const g of this.botgartClient.currentGuilds()) {
            for (const c of commanders) {
                let commander = this.botgartClient.commanders.getCommanderByTS3UID(c.tsCluid);
                if (commander === undefined) {
                    // user was newly discovered as tagged up -> save user without cooldown
                    LOG.debug(`Moving newly discovered ${c.tsDisplayName} to TAG_UP state.`);
                    commander = new Commander(c.accountName, c.tsDisplayName, c.tsCluid, c.tsChannelName, c.tsChannelPath, c.tsJoinUrl);
                    commander.setState(CommanderState.TAG_UP); // happens in constructor too, but for clarity
                    this.botgartClient.commanders.addCommander(commander);
                }

                const elapsed = now.diff(commander.getLastUpdate());
                switch (commander.getState()) {
                    case CommanderState.TAG_UP:
                        // user tagged up and is waiting to gain commander status
                        if (elapsed > this.gracePeriod) {
                            commander.setLastUpdate(now);
                            commander.setRaidStart(now);
                            commander.setState(CommanderState.COMMANDER);
                            commander.setTS3Channel(c.tsChannelName);
                            commander.setTs3channelPath(c.tsChannelPath);
                            commander.setCurrentLeadType(c.leadtype || "UNKNOWN");
                            LOG.debug(`Moving ${c.tsDisplayName} from TAG_UP to COMMANDER state.`);
                            await this.tagUp(g, commander);
                        }
                        break;

                    case CommanderState.COOLDOWN:
                        // user tagged up again too quickly -> wait out delay and then go into TAG_UP
                        if (elapsed > this.userDelay) {
                            LOG.debug(`Moving ${c.tsDisplayName} from COOLDOWN to TAG_UP state.`);
                            commander.setLastUpdate(now);
                            commander.setState(CommanderState.TAG_UP);
                        }
                        break;

                    case CommanderState.TAG_DOWN:
                        // user raided before, but tagged down in between
                        // -> if they waited long enough, go into TAG_UP, else sit out COOLDOWN
                        if (elapsed > this.userDelay) {
                            LOG.debug(`Moving ${c.tsDisplayName} from TAG_DOWN to TAG_UP state.`);
                            commander.setLastUpdate(now);
                            commander.setState(CommanderState.TAG_UP);
                        } else {
                            LOG.debug(`Moving ${c.tsDisplayName} from TAG_DOWN to COOLDOWN state.`);
                            commander.setState(CommanderState.COOLDOWN);
                        }
                        break;

                    case CommanderState.COMMANDER:
                        // still raiding -> update timestamp
                        commander.setLastUpdate(now);
                        commander.setCurrentLeadType(c.leadtype || "UNKNOWN");
                        commander.setTS3Channel(c.tsChannelName);
                        commander.setTs3channelPath(c.tsChannelPath);
                        await this.tagUpdate(g, commander);
                        break;
                }
            }

            for (const commander of taggedDown) {
                commander.setLastUpdate(now);
                commander.setState(CommanderState.TAG_DOWN);
                commander.setRaidEnd(now);
                LOG.debug(`Moving ${commander.getTS3ClientUID()} from COOLDOWN, TAG_UP, or COMMANDER to TAG_DOWN state.`);
                await this.tagDown(g, commander);
            }
        }

        this.patience = RECONNECT_PATIENCE;

        LOG.info("Done Commander Update.");
    }

    private tagDownAllDueToMissingConnection() {
        LOG.warn(`Could not reconnect to TS after ${RECONNECT_PATIENCE} tries. Tagging down all active commanders.`);
        this.botgartClient.commanders
            .getAllCommanders()
            .filter((commander) => commander.getDiscordMember() !== undefined)
            .map((commander) => this.botgartClient.guilds.cache.map((g) => this.tagDown(g, commander)));
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
            registration = await this.getRegistration(g.id, commander);
        }

        LOG.info("Registration Discord User:", registration?.user);
        if (registration !== null) {
            commander.setRegistration(registration);
            // the commander is member of the current discord -> give role
            const member: discord.GuildMember | undefined = await g.members.fetch({ user: registration.user }); // cache.find(m => m.id === registration.user);
            if (member !== undefined) {
                LOG.info("Registration Discord Member:", member.id);
                commander.setDiscordMember(member);
            } else {
                LOG.warn(
                    `Tried to find GuildMember for user with registration ID ${registration.user}, but could not find any. Maybe this is a caching problem?`
                );
            }
            await this.tagUpAssignRole(g, commander);
        }

        await this.botgartClient.tagBroadcastService
            .sendTagUpBroadcast(g, commander)
            .then((value) => commander.setBroadcastMessage(value))
            .catch((e) => LOG.error("Could send tag up broadcast", e));
    }

    /**
     * Makes the user tag down in a Discord-guild. That is:
     * - the role is removed from the user if he is present in the Discord
     * - the user's TS-UID-Discordname is forgotten
     */
    private async tagDown(g: discord.Guild, commander: Commander) {
        let registration: Registration | null = null;
        if (commander.getAccountName() !== null) {
            registration = await this.getRegistration(g.id, commander);
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
    }

    @UseRequestContext((type: CommanderPoller) => type.botgartClient.orm)
    private async getRegistration(guildId: string, commander: Commander) {
        return await this.botgartClient.registrationRepository.getUserByAccountName(guildId, commander.getAccountName()!);
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
