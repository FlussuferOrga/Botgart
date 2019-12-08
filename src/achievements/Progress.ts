import * as moment from "moment"
import * as L from "../Locale"
import * as discord from "discord.js"
import { BotgartClient } from "../BotgartClient"

abstract class Achievement {
    public readonly name: string;
    private client: BotgartClient;
    private imageURL: string;
    private repeatable: boolean;
    private announceRepetitions: boolean;

    public getName() {
        return L.get(`ACHIEVEMENT_NAME_${this.name.toUpperCase()}`)
    }

    public getDescription() {
        return L.get(`ACHIEVEMENT_DESC_${this.name.toUpperCase()}`)   
    }

    public getFlavourText() {
        return L.get(`ACHIEVEMENT_FLAV_${this.name.toUpperCase()}`)      
    }

    private award(player: string, by: string = null, timestamp: moment.Moment = null): number {
        timestamp = timestamp || moment.utc();
        const has = this.client.db.checkAchievement(this.name, player);
        if(this.repeatable || !has) {
            return this.client.db.awardAchievement(this.name, player, by, timestamp);
        }
        return -1;
    }

    public awardIn(guild: discord.Guild, player: string, by: string = null, timestamp: moment.Moment = null): null {
        return null;
    }

    public constructor(client: BotgartClient, name: string, imageURL: string, repeatable = true, announceRepetitions = false) {
        this.client = client;
        this.name = name;
        this.imageURL = imageURL;
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