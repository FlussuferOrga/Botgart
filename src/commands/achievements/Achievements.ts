const config = require("../config.json")
import * as moment from "moment"
import * as L from "../../Locale"
import * as discord from "discord.js"
import { BotgartClient } from "../../BotgartClient"
import * as Util from "../../Util"

export enum AchievementAwardResult {
    AWARDED_FIRST_TIME,
    AWARDED_AGAIN,
    NOT_AWARDED, // not repeatable
    USER_NOT_FOUND
}

export abstract class Achievement {
    public static readonly EASY_COLOUR: string = "#c0792e";
    public static readonly MEDIUM_COLOUR: string = "#dadada";
    public static readonly HARD_COLOUR: string = "#f5de3d";

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

    public constructor(client: BotgartClient, name: string, imageURL: string, roleName: string, roleColour: string = "BLUE", repeatable = false, announceRepetitions = false) {
        this.client = client;
        this.name = name;
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

        const gw2account: string = this.client.db.getUserByDiscordId(discordUser.user).gw2account;

        if(gw2account === undefined) {
            Util.log("warning", "Achievements.js", `Tried to award achievement '${this.name}' to player ${discordUser.displayName}, but could not find a linked gw2account.`);
            result = AchievementAwardResult.USER_NOT_FOUND;
        } else {
            const [rowId, isNew] = this.award(gw2account, by, timestamp);

            if(rowId > -1 && (isNew || (this.repeatable && this.announceRepetitions))) {
                const achievementChannel: discord.Channel = guild.channels.find(c => c instanceof discord.TextChannel && c.name === config.achievements.channel);

                if(achievementChannel) {
                   (<discord.TextChannel>achievementChannel).send(this.createEmbed(discordUser, rowId));
                } else {
                    Util.log("warning", "Achievements.js", `Tried to send achievement notification for achievement '${this.name}' for player ${discordUser.displayName} to achievement channel in guild ${guild.name}, but that channel does not exist.`);
                }

                const role: discord.Role = guild.roles.find(r => r.name === this.getRoleName());
                if(role) {
                    discordUser.addRole(role);
                } else {
                    guild.createRole({"name": this.roleName, "color": this.roleColour})
                      .then(r => discordUser.addRole(r))
                      .catch(e => Util.log("error", "Achievements.js", `Tried to assign achievement role '${this.getRoleName()}', which was not found in guild '${guild.name}', and the bot does not have the required permissions to give out this role.`));                    
                }
            }    
        }
        return result;
    }

    /**
    * Checks, if the user is elligble for the achievement.
    * If so, they will be awarded, if not, nothing happens.
    */
    public tryAward(discordUser: discord.GuildMember) {
        if(this.checkCondition(discordUser)) {
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

    public abstract checkCondition(discordUser: discord.GuildMember): boolean;
}

export class Glimmer extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "glimmer", 
                      "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png", 
                      "Glimmer", 
                      Achievement.EASY_COLOUR, 
                      false, // repeatable
                      false // announce repeats
        );

        client.ts3listener.on("tagdown", x => this.tryAward(x.discordUser));
    }

    public checkCondition(discordUser: discord.GuildMember): boolean {
        const user = this.client.db.getUserByDiscordId(discordUser.user);
        return this.client.db.getTotalLeadTime(user.gw2account) > 3600;
    }
}