import * as moment from "moment"
import * as L from "../../Locale"
import * as discord from "discord.js"
import { BotgartClient } from "../../BotgartClient"
import * as Util from "../../Util"

export abstract class Achievement {
    public readonly name: string;
    private client: BotgartClient;
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

    public constructor(client: BotgartClient, name: string, imageURL: string, roleName: string, roleColour: string = "BLUE", repeatable = true, announceRepetitions = false) {
        this.client = client;
        this.name = name;
        this.imageURL = imageURL;
        this.roleName = roleName;
        this.roleColour = roleColour;
        this.repeatable = repeatable;
        this.announceRepetitions = announceRepetitions;
    }

        /**
    * Awards the passed player this achievement.
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
    public awardIn(guild: discord.Guild, player: discord.GuildMember, by: string = null, timestamp: moment.Moment = null): void {
        let discordUser: discord.GuildMember;
        let gw2account: string;

        discordUser = player;
        gw2account = this.client.db.getUserByDiscordId(player.user).gw2account;
        // FIXME: check undefineds
        const [rowId, isNew] = this.award(gw2account, by, timestamp);
        //const discordPlayer: discord.GuildMember = dbuser === undefined ? undefined : guild.members.find(m => m.id === dbuser.user);
        
        if(rowId > -1 && (isNew || this.repeatable)) {
            const achievementChannel = guild.channels.find(c => c instanceof discord.TextChannel && c.name === "achievements");
            if(achievementChannel) {
               (<discord.TextChannel>achievementChannel).send(this.createEmbed(discordUser));
            }
            if(discordUser) {
                discordUser.addRole(this.getRoleName()).catch(e => {
                    guild.createRole({"name": this.roleName, "color": this.roleColour})
                      .then(r => discordUser.addRole(r))
                      .catch(e => Util.log("error", "Achievements.js", `Tried to assign achievement role '${this.getRoleName()}', which was not found in guild '${guild.name}', or the bot does not have the required permissions to give out this role.`))                   
                });
            }
        }
    }

    public createEmbed(player: discord.GuildMember) {
        return new discord.RichEmbed()
            .setAuthor(player)
            .setTitle(`${this.getName()}`)
            .setThumbnail(this.imageURL)
            .addField(L.get("ACHIEVEMENT_UNLOCKED", [], " | ", false), this.getDescription())
            .addField("\u200b", `${this.getFlavourText()}`)
            .setTimestamp(moment.utc().valueOf())
    }

    public abstract check(player: string): boolean;
}

export class Glimmer extends Achievement {
    public constructor(client: BotgartClient) {
        super(client, "glimmer", "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png", "Glimmer", "GREEN", false, false);
    }

    public check(player: string): boolean {
        return true;
    }
}