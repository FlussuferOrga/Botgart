const config = require("../../../config.json");
import * as moment from "moment";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import * as Util from "../../Util";
import { Commander } from "../../TS3Connection";

export enum AchievementAwardResult {
    AWARDED_FIRST_TIME,
    AWARDED_AGAIN,
    NOT_AWARDED, // not repeatable
    USER_NOT_FOUND,
    HIDDEN // users hides achievements
}

export abstract class Achievement {
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

    public constructor(client: BotgartClient, imageURL: string, roleName: string, roleColour: string = "BLUE", repeatable = false, announceRepetitions = false) {
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
            Util.log("warning", "Achievements.js", `Tried to award achievement '${this.name}' to player ${discordUser.displayName}, but could not find a linked gw2account.`);
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
                           (<discord.TextChannel>achievementChannel).send(this.createEmbed(discordUser, rowId));     
                        }                       
                    } else {
                        Util.log("warning", "Achievements.js", `Tried to send achievement notification for achievement '${this.name}' for player ${discordUser.displayName} to achievement channel in guild ${guild.name}, but that channel does not exist.`);
                    }

                    const role: discord.Role = guild.roles.find(r => r.name === this.getRoleName());
                    if(role) {
                        discordUser.addRole(role);
                    } else {
                        guild.createRole({"name": this.roleName, "color": this.roleColour})
                          .then(r => discordUser.addRole(r))
                          .catch(e => Util.log("error", "Achievements.js", `Tried to assign achievement role '${this.getRoleName()}', which was not found in guild '${guild.name}', and the bot does not have the required permissions to create this role.`));                    
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
    public tryAward(discordUser: discord.GuildMember, context: any) {
        // config.achievements.ignoring_roles.reduce((acc, x) => acc || discordUser.roles.has(x), false)
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

    public abstract checkCondition(discordUser: discord.GuildMember, context: any): boolean;
}

export class Glimmer extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png", 
                      "Schimmer", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 : false;
    }
}

export class Sunray extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/37/Cosmic_Ray.png", 
                      "Sonnenstrahl", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 * 10 : false;
    }
}

export class BlazingLight extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e6/Lunar_Impact.png", 
                      "Gleißendes Licht", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 * 100 : false;
    }
}

export class Supernova extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/ff/Astral_Wisp.png", 
                      "Supernova", 
                      Achievement.HARD_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 3600 * 1000 : false;
    }
}

export class Trailblazer extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e1/Banner_of_Strength.png", 
                      "Vorreiter", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Owl extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e3/Swoop_%28bird%29.png", 
                      "Eule", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Earlybird extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/3c/Hunter%27s_Call.png", 
                      "Früher Vogel", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Annihilator extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e4/Rampage.png", 
                      "Vernichter", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class NeverSurrender extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/6c/Vengeance_%28skill%29.png", 
                      "Niemals aufgeben!", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Strategist extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/8/8d/Mind_Wrack.png", 
                      "Stratege", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class UnchallengedSovereign extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/5/5f/Champion%27s_Crown.png", 
                      "Unbestrittener Beherrscher", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class AgileDefender extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/33/Iron_Guards.png", 
                      "Agiler Verteidiger", 
                      Achievement.HARD_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class ThoroughCommander extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/8/85/Watchtower.png", 
                      "Gründlicher Kommandeur", 
                      Achievement.HARD_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class BoldBesieger extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/32/Trebuchet_Blueprints.png", 
                      "Dreister Belagerer", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class TenaciousBesieger extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/63/Superior_Trebuchet_Blueprints.png", 
                      "Beharrlicher Belagerer", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Princess extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/f2/Princess.png", 
                      "Prinzessin", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Castling extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/fd/Arcane_Thievery.png", 
                      "Rochade", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Ettin extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/46/Mirror_Images.png", 
                      "Ettin", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Hydra extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/46/Mass_Invisibility.png", 
                      "Hydra", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Shiftchange extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/60/Phase_Retreat.png", 
                      "Schichtwechsel", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Bulletproof extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/2/24/Endure_Pain.png", 
                      "Kugelsicher", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class Boozecommander extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/1/16/Stein_of_Ale.png", 
                      "Promillekommandeur", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class FromAshes extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/c/c1/Phoenix.png", 
                      "Aus der Asche", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class ThePresident extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://simpsonspedia.net/images/b/b8/Arnold_Schwarzenegger.png", 
                      "Der Präsident", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class MountainIsCalling extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a1/Inspiring_Reinforcement.png", 
                      "Der Berg Ruft", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class ThePeak extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/c/c7/Fortify.png", 
                      "Der Gipfel", 
                      Achievement.MEDIUM_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        return false;
    }
}

export class GlimmerTest extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png", 
                      "SchimmerTest", 
                      Achievement.EASY_COLOUR, 
                      true, // repeatable
                      true // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser, undefined));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        console.log("total lead time", this.client.db.getTotalLeadTime(user.gw2account));
        return user ? this.client.db.getTotalLeadTime(user.gw2account) > 1 : false;
    }
}

export class ObjectiveTest extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png", 
                      "Zielobjekts Test", 
                      Achievement.HARD_COLOUR, 
                      true, // repeatable
                      true // announce repeats
        );

        client.gw2apiemitter.on("wvw-match", 
                                objs => this.client.commanders.getActiveCommanders()
                                                              .map(c => this.tryAward(c.getDiscordMember(), 
                                                                                      {"commander": c, "objectives": objs})));
    }

    public checkCondition(discordUser: discord.GuildMember, objectives: any): boolean {
        //const user = this.client.db.getUserByDiscordId(discordUser.user);
        const commander: Commander = objectives.commander;
        console.log("total lead time", this.client.db.getTotalLeadTime(commander.getAccountName()));
        return false;
        //return user ? this.client.db.getTotalLeadTime(user.gw2account) > 1 : false;
    }
}