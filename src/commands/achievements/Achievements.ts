const config = require("../../../config.json");
import * as moment from "moment";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import * as U from "../../Util";
import { Commander } from "../../TS3Connection";
import * as db from "../../DB";
import * as ts3 from "../../TS3Connection";
import * as gw2api from "../../emitters/APIEmitter";

export enum AchievementAwardResult {
    AWARDED_FIRST_TIME,
    AWARDED_AGAIN,
    NOT_AWARDED, // not repeatable
    USER_NOT_FOUND,
    HIDDEN // users hides achievements
}

/**
* Abstract achievement class. 
* C: type of the context passed to both tryAward() and checkCondition() subsequently.
*/
export abstract class Achievement<C> {
    public static readonly EASY_COLOUR: string = "#c97012"; // 13201426, AD8A56 11373142 
    public static readonly MEDIUM_COLOUR: string = "#dadada"; // 14342874
    public static readonly HARD_COLOUR: string = "#fcba03"; // 16562691

    public readonly name: string;
    protected client: BotgartClient;
    private imageURL: string;
    private repeatable: boolean;
    private roleName: string;
    private roleColour: string;
    private announceRepetitions: boolean;

    public getName(): string {
        return L.get(`ACHIEVEMENT_NAME_${this.name.toUpperCase()}`, [], " | ", false);
    }

    public getDescription(): string {
        return L.get(`ACHIEVEMENT_DESC_${this.name.toUpperCase()}`);
    }

    public getFlavourText(): string {
        return L.get(`ACHIEVEMENT_FLAV_${this.name.toUpperCase()}`, [], "\n", true, {"italic": true});     
    }

    public getRoleName(): string {
        return this.roleName;
    }

    public constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string = "BLUE", repeatable: boolean = false, announceRepetitions: boolean = false) {
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
    private award(gw2account: string, by: string = null, timestamp: moment.Moment = null): [number, boolean] {
        timestamp = timestamp || moment.utc();
        const has: boolean = this.client.db.checkAchievement(this.name, gw2account).length > 0;
        let rowId: number = -1;
        if(this.repeatable || !has) {
            rowId = this.client.db.awardAchievement(this.name, gw2account, by, timestamp);
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
    public awardIn(guild: discord.Guild, discordUser: discord.GuildMember, by: string = null, timestamp: moment.Moment = null): AchievementAwardResult {
        let result: AchievementAwardResult = AchievementAwardResult.NOT_AWARDED;

        const userdata = this.client.db.getUserByDiscordId(discordUser.user);
        if(userdata === undefined) {
            U.log("warning", "Achievements.js", `Tried to award achievement '${this.name}' to player ${discordUser.displayName}, but could not find a linked gw2account.`);
            result = AchievementAwardResult.USER_NOT_FOUND;
        } else {
            const gw2account: string = userdata.gw2account;
            if(discordUser.roles.some(r => config.achievements.ignoring_roles.includes(r.name))) {
                // user is hiding their achievements
                result = AchievementAwardResult.HIDDEN;
            } else {
                // actually award
                const [rowId, isNew] = this.award(gw2account, by, timestamp);

                if(rowId > -1 && (isNew || this.repeatable)) {
                    result = isNew ? AchievementAwardResult.AWARDED_FIRST_TIME : AchievementAwardResult.AWARDED_AGAIN;
                    const achievementChannel: discord.Channel = guild.channels.find(c => c instanceof discord.TextChannel && c.name === config.achievements.channel);

                    if(achievementChannel) {
                        if(isNew || this.announceRepetitions) {
                           (<discord.TextChannel>achievementChannel).send({reply: discordUser, embed: this.createEmbed(discordUser, rowId)});
                        }                       
                    } else {
                        U.log("warning", "Achievements.js", `Tried to send achievement notification for achievement '${this.name}' for player ${discordUser.displayName} to achievement channel in guild ${guild.name}, but that channel does not exist.`);
                    }

                    const role: discord.Role = guild.roles.find(r => r.name === this.getRoleName());
                    if(role) {
                        discordUser.addRole(role);
                    } else {
                        guild.createRole({"name": this.roleName, "color": this.roleColour})
                          .then(r => discordUser.addRole(r))
                          .catch(e => U.log("error", "Achievements.js", `Tried to assign achievement role '${this.getRoleName()}', which was not found in guild '${guild.name}', and the bot does not have the required permissions to create this role.`));                    
                    }
                }   
            } 
        }
        return result;
    }

    /**
    * Checks, if the user is elligble for the achievement.
    * If so, they will be awarded, if not, nothing happens.
    */
    public tryAward(discordUser: discord.GuildMember, context: C) {
        if(this.checkCondition(discordUser, context)) {
            this.awardIn(discordUser.guild, discordUser);
        }
    }

    public createEmbed(discordUser: discord.GuildMember, dbId: number) {
        return new discord.RichEmbed()
            .setAuthor(discordUser.displayName, discordUser.user.displayAvatarURL)
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
    public giveRole(discordUser: discord.GuildMember): boolean {
        let given = false;
        const role = discordUser.guild.roles.find(r => r.name === this.getRoleName());
        if(role) {
            discordUser.addRole(role);
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
    public removeRole(discordUser: discord.GuildMember): boolean {
        let removed = false;
        const role = discordUser.guild.roles.find(r => r.name === this.getRoleName());
        if(role) {
            discordUser.removeRole(role);
            removed = true;
        }
        return removed;
    }

    public abstract checkCondition(discordUser: discord.GuildMember, context: C): boolean;
}

abstract class TagUpAchievement extends Achievement<ts3.TagUp> {
    public constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
          super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);

          client.ts3listener.on("tagup", x => this.tryAward(x.commander.discordMember, x));
      }
}

abstract class TagDownAchievement extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
          super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);

          client.ts3listener.on("tagdown", x => this.tryAward(x.commander.discordMember, x));
      }
}

abstract class ObjectiveAchievement extends Achievement<{"commander": ts3.Commander, "objectives": gw2api.WvWMatches}> {
    public constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
          super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);

          client.gw2apiemitter.on("wvw-match", 
                                  objs => this.client
                                              .commanders
                                              .getActiveCommanders()
                                              .map(c => this.tryAward(c.getDiscordMember(), 
                                                                     {"commander": c, "objectives": objs})));
    }
}

abstract class NewMatchupAchievement extends Achievement<{lastMatchup: db.Matchup, newMatchup: db.Matchup}> {
    public constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string, repeatable: boolean, announceRepetitions: boolean) {
        super(client, imageURL, roleName, roleColour, repeatable, announceRepetitions);
        client.wvwWatcher.on("new-matchup",
                              mu => this.client 
                                        .db
                                        .getCommandersDuring(U.sqliteTimestampToMoment(mu.lastMatchup.start)
                                                             , U.sqliteTimestampToMoment(mu.lastMatchup.end))
                                        .map(r => {
                                            const guild: discord.Guild = client.guilds.get(r.guild);
                                            return guild ? guild.members.get(r.user) : undefined;
                                        })
                                        .filter(c => c !== undefined)
                                        .map(c => this.tryAward(c, mu)));
    }
}

//------------------------------------------------------------------------------
// ACHIEVEMENTS
//------------------------------------------------------------------------------

export class Glimmer extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png", 
                      "Schimmer", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 : false;
    }
}

export class Sunray extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/37/Cosmic_Ray.png", 
                      "Sonnenstrahl", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 * 10 : false;
    }
}

export class BlazingLight extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e6/Lunar_Impact.png", 
                      "Gleißendes Licht", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 * 100 : false;
    }
}

export class Supernova extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/ff/Astral_Wisp.png", 
                      "Supernova", 
                      Achievement.HARD_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 * 1000 : false;
    }
}

export class Trailblazer extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e1/Banner_of_Strength.png", 
                      "Vorreiter", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const rs: moment.Moment = context.commander.getRaidStart();
        const min: number = U.getResetTime().minute();
        const before: moment.Moment = U.getResetTime().minute(min-20);
        const after: moment.Moment = U.getResetTime().minute(min+20);
        return rs.weekday() === U.RESET_WEEKDAY && rs.isBetween(before,after) && context.commander.getRaidTime() > 3600;
    }
}

export class Owl extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e3/Swoop_%28bird%29.png", 
                      "Eule", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return U.isBetweenTime(context.commander.getRaidStart(), "23:00:00", "06:00:00") && context.commander.getRaidTime() > 3600;
    }
}

export class Earlybird extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/3c/Hunter%27s_Call.png", 
                      "Früher Vogel", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
      return U.isBetweenTime(context.commander.getRaidStart(), "06:00:00", "10:00:00") && context.commander.getRaidTime() > 3600;
    }
}

export class Annihilator extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e4/Rampage.png", 
                      "Vernichter", 
                      Achievement.HARD_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {"commander": ts3.Commander, "objectives": gw2api.WvWMatches}): boolean {
        let holds = false;
        const obj = context.objectives;
        const ourColour: string = Object.entries(obj.all_worlds).find(([key, value]) => value.includes(config.home_id))[0]; 
        if(ourColour === undefined) {
          U.log("warning", "Achievements.js", `Could not find our home id '${config.home_id}' within the matchup emitted by the API emitter. Only found ${Object.entries(obj.all_worlds)}. Either the config is broken or the emitter sends out faulty events.`);
        } else {
          holds = obj.kills[ourColour]/obj.kills[ourColour] >= 2.0;
        }
        return holds;
    }
}

// fixme
export class NeverSurrender extends Achievement<ts3.TagUp> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/6c/Vengeance_%28skill%29.png", 
                      "Niemals aufgeben!", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagUp): boolean {
        return false;
    }
}

// fixme
export class Strategist extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/8/8d/Mind_Wrack.png", 
                      "Stratege", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

// fixme
export class UnchallengedSovereign extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/5/5f/Champion%27s_Crown.png", 
                      "Unbestrittener Beherrscher", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

// fixme
export class AgileDefender extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/33/Iron_Guards.png", 
                      "Agiler Verteidiger", 
                      Achievement.HARD_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const holds: boolean = context.commander.getRaidTime() > 3600;
        if(holds) {
            const t3AtStart: number[] = this.client.db.getObjectivesAround(context.commander.getRaidStart())
                              .filter(obj => obj.tier === 3)
                              .map(obj => obj.objective_id);
            if(t3AtStart) {
                this.client.db.getObjectivesAround()
                .filter(obj => obj.tier === 3 && t3AtStart.includes(obj.objective_id));
            }
        }
        return false;
    }
}

// fixme
export class ThoroughCommander extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/8/85/Watchtower.png", 
                      "Gründlicher Kommandeur", 
                      Achievement.HARD_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

// fixme
export class BoldBesieger extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/32/Trebuchet_Blueprints.png", 
                      "Dreister Belagerer", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

// fixme
export class TenaciousBesieger extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/63/Superior_Trebuchet_Blueprints.png", 
                      "Beharrlicher Belagerer", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

export class Princess extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/f2/Princess.png", 
                      "Prinzessin", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {"commander": ts3.Commander, "objectives": gw2api.WvWMatches}): boolean {
        const palaceID: string = "1099-114"; // https://api.guildwars2.com/v2/wvw/objectives?ids=1099-114
        const colour: db.FactionColour = this.client.db.getFactionColour(moment.utc(), config.home_id);
        return colour !== undefined && this.client.db.wasCapturedBetween(context.commander.getRaidStart(), moment.utc(), palaceID, colour);
    }
}

// fixme
export class Castling extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/fd/Arcane_Thievery.png", 
                      "Rochade", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

export class Ettin extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/46/Mirror_Images.png", 
                      "Ettin", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {"commander": ts3.Commander, "objectives": gw2api.WvWMatches}): boolean {
        return this.client.commanders.getActiveCommanders().filter(c => c.getRaidTime() > 3600).length > 2;
    }
}

export class Hydra extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/46/Mass_Invisibility.png", 
                      "Hydra", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {"commander": ts3.Commander, "objectives": gw2api.WvWMatches}): boolean {
        return this.client.commanders.getActiveCommanders().filter(c => c.getRaidTime() > 3600).length > 3;
    }
}

// fixme
export class Shiftchange extends TagUpAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/60/Phase_Retreat.png", 
                      "Schichtwechsel", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagUp): boolean {
        return false;
    }
}

// fixme
export class Bulletproof extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/2/24/Endure_Pain.png", 
                      "Kugelsicher", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

export class Boozecommander extends Achievement<ts3.TagDown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/1/16/Stein_of_Ale.png", 
                      "Promillekommandeur", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

export class FromAshes extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/c/c1/Phoenix.png", 
                      "Aus der Asche", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {lastMatchup: db.Matchup, newMatchup: db.Matchup}): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 4 && context.newMatchup.tier === 3;
    }
}

export class MountainIsCalling extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a1/Inspiring_Reinforcement.png", 
                      "Der Berg Ruft", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {lastMatchup: db.Matchup, newMatchup: db.Matchup}): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 3 && context.newMatchup.tier === 2;
    }
}

export class ThePeak extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/c/c7/Fortify.png", 
                      "Der Gipfel", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {lastMatchup: db.Matchup, newMatchup: db.Matchup}): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 2 && context.newMatchup.tier === 1;
    }
}

export class TierSolidifier extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/31/%22Stand_Your_Ground%21%22.png", 
                      "Verfestiger", 
                      Achievement.MEDIUM_COLOUR, 
                      true, // repeatable
                      false // announce repeats
        );
    }

    public checkCondition(discordUser: discord.GuildMember, context: {lastMatchup: db.Matchup, newMatchup: db.Matchup}): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === context.newMatchup.tier;
    }
}