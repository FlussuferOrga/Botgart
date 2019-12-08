import * as moment from "moment"
import * as L from "../Locale"
import * as discord from "discord.js"
import { BotgartClient } from "../BotgartClient"
import * as Util from "../Util"

abstract class Achievement {
    public readonly name: string;
    private client: BotgartClient;
    private imageURL: string;
    private repeatable: boolean;
    private roleName: string;
    private announceRepetitions: boolean;

    public getName(): string {
        return L.get(`ACHIEVEMENT_NAME_${this.name.toUpperCase()}`)
    }

    public getDescription(): string {
        return L.get(`ACHIEVEMENT_DESC_${this.name.toUpperCase()}`)   
    }

    public getFlavourText(): string {
        return L.get(`ACHIEVEMENT_FLAV_${this.name.toUpperCase()}`)      
    }

    public getRoleName(): string {
        return this.roleName;
    }

    /**
    * Awards the passed player this achievement.
    * If the player already has the achievement and it is not repeatable, it will not be assigned again. 
    * Whether the achievement was actually awarded is implied by the return value.
    * player: gw2account of the player to award 
    * by: who awarded the achievement (can be the name of a moderator, or null if it was assigned automatically)
    * timestamp: when the achievement was granted, will be NOW if null was passed
    * returns: tuple of [0] the row id of newly created row in the table of achievements. 
    *          -1 implies that the achievement was not actually awarded, because it is not repeatable and the player already has the achievement. 
    *          and [1] whether this achievement was awarded for the first time, which will be relevant to determine whether to post something to Discord. 
    */
    private award(player: string, by: string = null, timestamp: moment.Moment = null): [number, boolean] {
        timestamp = timestamp || moment.utc();
        const has: boolean = this.client.db.checkAchievement(this.name, player).length > 0;
        let rowId: number = -1;
        if(this.repeatable || !has) {
            rowId = this.client.db.awardAchievement(this.name, player, by, timestamp);
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
    public awardIn(guild: discord.Guild, player: string, by: string = null, timestamp: moment.Moment = null): void {
        const [rowId, isNew] = this.award(player, by, timestamp);
        const discordPlayer: discord.GuildMember = guild.members.find(m => m.id === this.client.db.getUserByGW2Account(player).user);
        
        if(rowId > -1 && (isNew || this.repeatable)) {
            const achievementChannel = guild.channels.find(c => c instanceof discord.TextChannel && c.name === "achievements");
            if(achievementChannel) {
               (<discord.TextChannel>achievementChannel).send(this.createEmbed(player));
            }
            if(discordPlayer) {
                discordPlayer.addRole(this.getRoleName()).catch(e => {
                    Util.log("error", "Achievements.js", `Tried to assign achievement role '${this.getRoleName()}', which was not found in guild '${guild.name}', or the bot does not have the required permissions to give out this role.`);
                });
            }
        }
    }

    public constructor(client: BotgartClient, name: string, imageURL: string, roleName: string, repeatable = true, announceRepetitions = false) {
        this.client = client;
        this.name = name;
        this.imageURL = imageURL;
        this.roleName = roleName;
        this.repeatable = repeatable;
        this.announceRepetitions = announceRepetitions;
    }

    public createEmbed(player: string) {
        return new discord.RichEmbed()
            .setTitle(this.getName())
            .setDescription(L.get("ACHIEVEMENT_UNLOCKED", [], "|", false))
            .setThumbnail(this.imageURL)
            .addField("asd", this.getDescription())
            .addField("asd", this.getFlavourText())
            .setTimestamp(moment.utc().valueOf())
    }

    public abstract check(player: string): boolean;
}