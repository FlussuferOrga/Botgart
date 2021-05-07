import discord from "discord.js";
import moment from "moment-timezone";
import { BotgartClient } from "../../BotgartClient";
import { getConfig } from "../../config/Config";
import { RosterRepository } from "../../repositories/RosterRepository";
import { logger } from "../../util/Logging";
import * as Util from "../../util/Util";
import { ResetLeader } from "./ResetLeader";
import * as ResetUtil from "./ResetUtil";
import { Roster } from "./Roster";
import { WvwMap } from "./WvwMap";


const LOG = logger();

export class RosterService {
    private static readonly UPDATE_DELAY = 1000;
    private static readonly WITHDRAW = "❌"; // cross
    private static readonly VISIBLE = "📣"; // megaphone

    private static readonly EMOTES: string[] = [
        ...WvwMap.getMaps().map(m => m.emote), RosterService.WITHDRAW, RosterService.VISIBLE
    ];

    private repository: RosterRepository;

    private client: BotgartClient;

    private rosters: { [key: string]: [discord.Guild, discord.Message, Roster] };

    private syncScheduled: boolean;


    constructor(repository: RosterRepository, client: BotgartClient) {
        this.repository = repository;
        this.client = client;

        this.rosters = {};

        this.syncScheduled = false;
    }

    public getCachedRoster(guild: discord.Guild, weekNumber: number, year: number): [discord.Guild, discord.Message, Roster] | undefined {
        const k = RosterService.toRosterKey(guild, weekNumber, year);
        return k in this.rosters ? this.rosters[k] : undefined;
    }

    public storeInRosterCache(weekNumber: number, year: number, guild: discord.Guild, message: discord.Message, roster: Roster): void {
        this.rosters[RosterService.toRosterKey(guild, weekNumber, year)] = [guild, message, roster];
    }

    private static toRosterKey(guild: discord.Guild, weekNumber: number, year: number): string {
        return `${guild.id}|${year}|${weekNumber}`;
    }

    public prepareRefresh(guild: discord.Guild, message: discord.Message, roster: Roster): void {
        const dbRoster = this.getCachedRoster(guild, roster.weekNumber, roster.year);
        if (dbRoster === undefined) {
            LOG.error(`Received request to watch roster for week ${roster.weekNumber}, but no meta information was found in the database.`);
            return;
        }
        const refreshDelayedFn = (eventRoster: Roster, map: string, p: string) => {
            const onDelayReached = function (service: RosterService, roster: Roster) { // no arrow function, as we need to bind()!
                service.refreshGuarded(guild, roster, message);
            }.bind(null, this, eventRoster);

            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            setTimeout(onDelayReached, RosterService.UPDATE_DELAY);
        };
        roster.on("addleader", refreshDelayedFn);
        roster.on("removeleader", refreshDelayedFn);
        roster.on("togglevisibility", refreshDelayedFn);
    }

    // only updating post, DB, and TS3 in fixed intervals
    // reduces strain if people are being funny by clicking around wildly
    // and only updates once if someone who was tagged for multiple maps
    // pulls back, instead for once for every map.
    public refreshGuarded(guild: discord.Guild, roster: Roster, message: discord.Message) {
        if (this.syncScheduled) return;
        this.syncScheduled = true;
        this.refresh(guild, roster, message);
        this.syncScheduled = false;
    }

    private refresh(guild: discord.Guild, roster: Roster, message: discord.Message) {
        this.repository.upsertRosterPost(guild, roster, message);
        message.edit(roster.toMessage(), roster.toMessageEmbed());

        if (roster.isUpcoming()) {
            this.syncToTS3(guild, roster);
        }
    }

    public watchRosterMessageReactions(message: discord.Message, roster: Roster): void {
        LOG.debug("Now watching message {0} as roster for week {1}.".formatUnicorn(message.url, roster.weekNumber));
        message.createReactionCollector(e =>
            RosterService.EMOTES.includes(e.emoji.name), {}).on("collect", r => this.processReacts(r, roster));

        for (const [_, e] of message.reactions.cache) {
            this.processReacts(e, roster);
        }
    }

    private async processReacts(partialReaction: discord.MessageReaction, roster: Roster) {
        let r = partialReaction;
        if (r.partial) {
            r = await r.fetch();
        }
        const mapForEmote = WvwMap.getMapByEmote(r.emoji.name);
        const reactedUsers = await r.users.fetch();
        reactedUsers
            .filter(user => user.id !== this.client.user?.id)
            .forEach(user => { // reactions coming from anyone but the bot
                const formattedName = Util.formatUserPing(user.id);
                if (!mapForEmote) {
                    if (r.emoji.name === RosterService.WITHDRAW) { // X -> user wants to remove themselves from roster
                        roster.removeLead(undefined, new ResetLeader(formattedName, false)); // equality is defined by name, so wrapping the name in ResetLeader is sufficient to find all instances of that user
                    } else if (r.emoji.name === RosterService.VISIBLE) {
                        roster.toggleLeaderVisibility(formattedName);
                    }
                } else {
                    roster.addLeadByName(mapForEmote, formattedName);
                }
                r.users.remove(user);
            });
    }

    public createRoster(guild: discord.Guild, channel: discord.TextChannel, rosterYear, rosterWeek) {
        const roster = new Roster(rosterWeek, rosterYear);
        channel.send(roster.toMessage(), roster.toMessageEmbed())
            .then(async (mes: discord.Message) => {
                for (const e of RosterService.EMOTES) {
                    await mes.react(e);
                }
                this.storeInRosterCache(roster.weekNumber, roster.year, guild, mes, roster);
                this.repository.upsertRosterPost(guild, roster, mes); // initial save
                this.watchRosterMessageReactions(mes, roster);
                this.prepareRefresh(guild, mes, roster);
            });
        if (roster.isUpcoming()) {
            this.syncToTS3(guild, roster);
        }
    }

    public onStartup() {
        this.client.guilds.cache.forEach(g => {
            Promise.all(this.repository.getActiveRosters(g)).then(ars => {
                ars.filter(([dbRoster, _, __]) => dbRoster !== undefined)
                    .forEach(([dbRoster, dbChannel, dbMessage]) => {
                        this.startup(dbRoster, dbChannel, dbMessage);
                    });
            });
        });

        this.initSyncToTS3();
    }

    private startup(dbRoster: Roster, dbChannel: discord.TextChannel, dbMessage: discord.Message) {
        this.storeInRosterCache(dbRoster.weekNumber, dbRoster.year, dbChannel.guild, dbMessage, dbRoster);
        this.prepareRefresh(dbChannel.guild, dbMessage, dbRoster); // can not be initialised in direct messages anyway
        this.watchRosterMessageReactions(dbMessage, dbRoster);
    }

    private initSyncToTS3(): void {
        const rosterWeek = ResetUtil.currentWeek();
        const rosterYear = moment().utc().year();
        const guilds = this.client.guilds.cache;

        guilds.forEach(async (guild) => {
            const roster: undefined | [Roster, discord.TextChannel, discord.Message] = await this.repository.getRosterPost(guild, rosterWeek, rosterYear);

            if (roster === undefined) {
                LOG.error(`Received request to start the initial ts3 sync for ${rosterWeek}, but no roster post exists for said week.`);
            } else {
                const [r, chan, mes] = roster;
                this.syncToTS3(guild, r);
            }
        });
    }

    private async syncToTS3(guild: discord.Guild, roster: Roster): Promise<void> {
        // users are stored as <@123123123123> when clicking themselves, or as <!123123123123> when added through command.
        // Resolve if possible.


        const resolveUser: (string) => Promise<string> = async sid => {
            const idregxp = /<[@!](\d+)>/;
            const match = idregxp.exec(sid);
            let user = sid;
            if (match !== null) {
                const resolved: discord.GuildMember | undefined = await guild.members.fetch(match[1]);
                if (resolved !== undefined) {
                    user = resolved.displayName;
                }
            }
            return user;
        };
        const resetDateTime = roster.getResetMoment().tz(getConfig().get().timeZone);
        await this.client.getTS3Connection().post("resetroster", {
            "date": resetDateTime.format("DD.MM.YYYY HH:mm z"), // TODO: remove
            "datetime": resetDateTime.format(),
            "rbl": await Promise.all(Array.from(roster.getMapLeaders(WvwMap.RedBorderlands)).map(l => resolveUser(l.name))),
            "gbl": await Promise.all(Array.from(roster.getMapLeaders(WvwMap.GreenBorderlands)).map(l => resolveUser(l.name))),
            "bbl": await Promise.all(Array.from(roster.getMapLeaders(WvwMap.BlueBorderlands)).map(l => resolveUser(l.name))),
            "ebg": await Promise.all(Array.from(roster.getMapLeaders(WvwMap.EternalBattlegrounds)).map(l => resolveUser(l.name)))
        });
    }
}