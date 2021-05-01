import discord from "discord.js";
import * as moment from "moment";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import * as gw2api from "../emitters/APIEmitter";
import * as L from "../Locale";
import { logger } from "../Logging";
import { Matchup } from "../repositories/MatchupRepository";
import * as ts3 from "../TS3Connection";
import * as U from "../Util";

export enum AchievementAwardResult {
    AWARDED_FIRST_TIME,
    AWARDED_AGAIN,
    NOT_AWARDED, // not repeatable
    USER_NOT_FOUND,
    HIDDEN // users hides achievements
}

const LOG = logger();

/**
 * Abstract achievement class.
 * C: type of the context passed to both tryAward() and checkCondition() subsequently.
 */
export abstract class Achievement<C> {
    public static readonly EASY_COLOUR: string = "#c97012"; // 13201426, AD8A56 11373142
    public static readonly MEDIUM_COLOUR: string = "#dadada"; // 14342874
    public static readonly HARD_COLOUR: string = "#fcba03"; // 16562691

    readonly name: string;
    client: BotgartClient;
    imageURL: string;
    repeatable: boolean;
    roleName: string;
    roleColour: string;
    announceRepetitions: boolean;

    getName(): string {
        return L.get(`ACHIEVEMENT_NAME_${this.name.toUpperCase()}`, [], " | ", false);
    }

    getDescription(): string {
        return L.get(`ACHIEVEMENT_DESC_${this.name.toUpperCase()}`);
    }

    getFlavourText(): string {
        return L.get(`ACHIEVEMENT_FLAV_${this.name.toUpperCase()}`, [], "\n", true, {"italic": true});
    }

    getRoleName(): string {
        return this.roleName;
    }

    protected constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string = "BLUE", repeatable: boolean = false, announceRepetitions: boolean = false) {
        this.client = client;
        this.name = this.constructor.name;
        this.imageURL = imageURL;
        this.roleName = roleName;
        this.roleColour = roleColour;
        this.repeatable = repeatable;
        this.announceRepetitions = announceRepetitions;
    }

    /**
     * Awards the passed player this achievement in the database.
     * If the player already has the achievement and it is not repeatable, it will not be assigned again.
     * Whether the achievement was actually awarded is implied by the return value.
     * Note that calling this method directly will award a player the achievement even if they are hiding their achievements.
     * gw2account: gw2account of the player to award
     * by: who awarded the achievement (can be the name of a moderator, or null if it was assigned automatically)
     * timestamp: when the achievement was granted, will be NOW if null was passed
     * returns: tuple of [0] the row id of newly created row in the table of achievements.
     *          -1 implies that the achievement was not actually awarded, because it is not repeatable and the player already has the achievement.
     *          and [1] whether this achievement was awarded for the first time, which will be relevant to determine whether to post something to Discord.
     */
    award(gw2account: string, by?: string, timestamp?: moment.Moment): [number, boolean] {
        timestamp = timestamp || moment.utc();
        by = by ?? "";
        const repo = this.client.achievementRepository;
        const has: boolean = repo.checkAchievement(this.name, gw2account).length > 0;
        let rowId: number = -1;
        if (this.repeatable || !has) {
            rowId = repo.awardAchievement(this.name, gw2account, by, timestamp);
        }
        return [rowId, !has];
    }

    /**
     * Awards a Discord user. Tries to give out a role and posts the notification, if appropriate.
     * guild: to Guild to award the player in (role and post)
     * player: see award()
     * by: see award()
     * timestamp: see award()
     */
    awardIn(guild: discord.Guild, discordUser: discord.GuildMember, by?: string, timestamp?: moment.Moment): AchievementAwardResult {
        let result: AchievementAwardResult = AchievementAwardResult.NOT_AWARDED;

        const userdata = this.client.registrationRepository.getUserByDiscordId(discordUser.user);
        if (userdata === undefined) {
            LOG.warn(`Tried to award achievement '${this.name}' to player ${discordUser.displayName}, but could not find a linked gw2account.`)
            result = AchievementAwardResult.USER_NOT_FOUND;
        } else {
            const gw2account: string = userdata.gw2account;
            if (discordUser.roles.cache.some(r => getConfig().get().achievements.ignoring_roles.includes(r.name))) {
                // user is hiding their achievements
                result = AchievementAwardResult.HIDDEN;
            } else {
                // actually award
                const [rowId, isNew] = this.award(gw2account, by, timestamp);

                if (rowId > -1 && (isNew || this.repeatable)) {
                    result = isNew ? AchievementAwardResult.AWARDED_FIRST_TIME : AchievementAwardResult.AWARDED_AGAIN;
                    const achievementChannel: discord.Channel | undefined = guild.channels.cache.find(c => c instanceof discord.TextChannel && c.name === getConfig().get().achievements.channel);

                    if (achievementChannel !== undefined) {
                        if (isNew || this.announceRepetitions) {
                            // text does not matter at all, but Discord does not mention users anymore if the text is completely empty, it would seem
                            (achievementChannel as discord.TextChannel).send("🏆", {
                                reply: discordUser,
                                embed: this.createEmbed(discordUser, rowId)
                            });

                        }
                    } else {
                        LOG.warn(`Tried to send achievement notification for achievement '${this.name}' for player ${discordUser.displayName} to achievement channel in guild ${guild.name}, but that channel does not exist.`)
                    }

                    const role = this.getRole(guild)
                    if (role !== undefined) {
                        discordUser.roles.add(role);
                    } else {
                        this.createRole(guild)
                            .then(r => discordUser.roles.add(r))
                            .catch(e => LOG.error(`Tried to assign achievement role '${this.getRoleName()}', which was not found in guild '${guild.name}', and the bot does not have the required permissions to create this role.`));
                    }
                }
            }
        }
        return result;
    }

    private createRole(guild: discord.Guild) {
        return guild.roles.create({data: {name: this.roleName, color: this.roleColour}, reason: "Achievement"});
    }

    /**
     * Checks, if the user is elligble for the achievement.
     * If so, they will be awarded, if not, nothing happens.
     */
    tryAward(discordUser: discord.GuildMember, context: C) {
        if (!getConfig().get().achievements.enabled) {
            LOG.debug(`Checking condition for achievement ${this.name} for player ${discordUser.displayName}...`)
            if (this.checkCondition(discordUser, context)) {
                LOG.debug(`Success! Awarding achievement to user.`)
                this.awardIn(discordUser.guild, discordUser);
            } else {
                LOG.debug(`User did not pass condition.`)
            }
        }
    }

    createEmbed(discordUser: discord.GuildMember, dbId: number) {
        return new discord.MessageEmbed()
            .setAuthor(discordUser.displayName, discordUser.user.displayAvatarURL())
            .setColor(this.roleColour)
            .setTitle(`${this.getName()}`)
            .setThumbnail(this.imageURL)
            .addField(L.get("ACHIEVEMENT_UNLOCKED", [], " | ", false), this.getDescription())
            .addField("\u200b", `${this.getFlavourText()}`)
            .setTimestamp(moment.utc().valueOf())
            .setFooter(dbId);
    }

    /**
     * Convenience method to give a user the role linked to this achievement.
     * Useful to restore roles for a user after they rejoined the Discord after
     * they have already earned the achievement.
     * discordUser: the user to grant the role to in that exact guild.
     * returns: true, if the achievement role was found in the guild and
     *          addRole was called (this doesn't imply wether the role was actually added!)
     */
    giveRole(discordUser: discord.GuildMember): boolean {
        let given = false;
        const role = this.getRole(discordUser.guild)
        if (role) {
            discordUser.roles.add(role);
            given = true;
        }
        return given;
    }

    /**
     * Convenience method to remove the role linked to this achievement from a user.
     * discordUser: the user to remove the role from in their guild.
     * returns: true, if the achievement role was found in the guild and
     *          removeRole was called (this doesn't imply wether the role was actually removed!)
     */
    removeRole(discordUser: discord.GuildMember): boolean {
        let removed = false;
        const role = this.getRole(discordUser.guild);
        if (role) {
            discordUser.roles.remove(role);
            removed = true;
        }
        return removed;
    }

    private getRole(guild: discord.Guild) {
        return guild.roles.cache.find(r => r.name === this.getRoleName());
    }

    abstract checkCondition(discordUser: discord.GuildMember, context: C): boolean;
}

export abstract class TagUpAchievement extends Achievement<ts3.TagUp> {
    protected constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
        super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);

        client.ts3listener.on("tagup", (x: ts3.TagUpEvent) => {
            if (x.commander.getDiscordMember() !== undefined) {
                this.tryAward(<discord.GuildMember>x.commander.getDiscordMember(), x);
            } else {
                LOG.warn(`Tries to check tagup-achievement for user without Discord account ${x.dbRegistration}!`)
            }
        });
    }
}

export abstract class TagDownAchievement extends Achievement<ts3.TagDown> {
    protected constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
        super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);

        client.ts3listener.on("tagdown", (x: ts3.TagDownEvent) => {
            if (x.commander.getDiscordMember() !== undefined) {
                this.tryAward(<discord.GuildMember>x.commander.getDiscordMember(), x);
            } else {
                LOG.warn(`Tries to check tagdown-achievement for user without Discord account ${x.dbRegistration}!`)
            }
        });
    }
}

export abstract class ObjectiveAchievement extends Achievement<{ "commander": ts3.Commander, "objectives": gw2api.WvWMatches }> {
    protected constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
        super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);

        client.gw2apiemitter.on("wvw-matches",
            async (prom) => {
                const objs = await prom;
                this.client
                    .commanders
                    .getActiveCommanders()
                    .filter(c => c.getDiscordMember() !== undefined)
                    .map(c => this.tryAward(<discord.GuildMember>c.getDiscordMember(),
                        {"commander": c, "objectives": objs}))
            });
    }
}

export abstract class NewMatchupAchievement extends Achievement<{ lastMatchup: Matchup, newMatchup: Matchup }> {
    protected constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
        super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);
        client.wvwWatcher.on("new-matchup",
            mu => {
                if (mu.lastMatchup === undefined) return; // ignore for very first matchup that is stored
                Promise.all(
                    this.client.tsLeadRepository
                        .getCommandersDuring(U.sqliteTimestampToMoment(mu.lastMatchup.start)
                            , U.sqliteTimestampToMoment(mu.lastMatchup.end))
                        .map(async r => {
                            const guild: discord.Guild | undefined = client.guilds.cache.get(r.guild);
                            return guild !== undefined ? await guild.members.fetch(r.user) : undefined // .cache.get(r.user) : undefined;
                        })
                ).then(gm =>
                    gm.filter(c => c !== undefined)
                        .map((c: discord.GuildMember) => this.tryAward(c, mu))
                );
            });
    }
}