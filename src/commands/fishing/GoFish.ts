import { Command, Listener } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as db from "../../DB";
import * as https from "https";
import * as cheerio from "cheerio";

/**
Testcases:

*/
const REEL_EMOTE = "🎣";
const REEL_BASE_TIME = 5000;
const WAIT_MIN_SECONDS = 2;
const WAIT_MAX_SECONDS = 7; //150;

function gets(url: string, options = {}): Promise<string> {
 return new Promise<string>((resolve, reject) => {
    https.get(url, options, (response) => {
      let body = ""
      response.on("data", (chunk) => body += chunk)
      response.on("end", () => resolve(body))
    }).on("error", reject)
  });
}

async function image(term: string): Promise<string> {
    let image: string = "";

    try {
        const response = await gets(`https://results.dogpile.com/serp?qc=images&q=${term}`, {
            headers: {
                "Accept": "text/html",
                "User-Agent": "Chrome"
            }
        });

        const page = cheerio.load(response);
        const links = page(".image a.link");
        const urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr("href"));
        image = urls.length === 0 ? "" : urls[Math.floor(Math.random() * urls.length)];
    } catch(e) {
        Util.log("error", "Fish.js", `Error while trying to retrieve random image from Dogpile: ${e}`);
    }
    return image;
}

class ActiveFisher {
    private client: BotgartClient;
    private fisher: discord.User;
    private message: discord.Message;
    private fish: db.Fish;
    private ended: boolean;

    public constructor(client: BotgartClient, fisher: discord.User, message: discord.Message, fish: db.Fish) {
        this.client = client;
        this.fisher = fisher;
        this.message = message;
        this.fish = fish;
        this.ended = false;
    }

    public async createIdleEmbed(): Promise<discord.RichEmbed> {
        return new discord.RichEmbed()
                    .setTitle(L.get("FISHING_IDLE_TITLE", [], " | ", false))
                    .setColor(0x0000FF)
                    .setDescription(L.get("FISHING_IDLE_DESCRIPTION"))
                    .setImage(await image("river"))
    }

    public async createBittenEmbed(): Promise<discord.RichEmbed> {
        return this.createIdleEmbed();
    }

    public async createCaughtEmbed(): Promise<discord.RichEmbed> {
        return new discord.RichEmbed()
                    .setTitle(L.get("FISHING_CAUGHT_TITLE", [], " | ", false))
                    .setColor(0x00FF00)
                    .setDescription(L.get("FISHING_CAUGHT_DESCRIPTION"))
                    .setImage(this.fish.image)
                    .addField(":fish:", `${this.fish.name}`, true)
                    .addField(":scales:", `${this.fish.weight} g`, true)
                    .addField(":moneybag:", `${this.fish.points_per_gramm * this.fish.weight}`, true);
    }

    public async createEscapedEmbed(): Promise<discord.RichEmbed> {
        return new discord.RichEmbed()
                    .setTitle(L.get("FISHING_ESCAPED_TITLE", [], " | ", false))
                    .setColor(0xFF0000)
                    .setDescription(L.get("FISHING_ESCAPED_DESCRIPTION"))
                    .setImage(await image("sunset"))
    }

    public async bite(): Promise<void> {
        await this.message.edit(this.createBittenEmbed());
        await this.message.react(REEL_EMOTE);
        this.message.createReactionCollector((e,u) => u.id !== this.client.user.id && e.emoji.name === REEL_EMOTE, {time: REEL_BASE_TIME * this.fish.reel_time_factor})
                    .on("collect", r => this.end(true))
                    .on("end", rs => this.end(rs.size > 0));
        ;
    }

    private async end(reeled: boolean): Promise<void> {
        if(this.ended) return;
        this.ended = true;

        if(reeled) {
            this.client.db.catchFish(this.fisher, this.fish);
            await this.message.edit(await this.createCaughtEmbed());
        } else {
            await this.message.edit(await this.createEscapedEmbed());
        }
        this.message.reactions.deleteAll();
    }
}

export class GoFish extends BotgartCommand {
    constructor() {
        super("gofish", {
            aliases: ["gofish"],
            split: "quoted",
        },
        true,  // available per DM
        false, // cronable
        1 // everyone permission
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const fish: db.Fish = this.getBotgartClient().db.getRandomFish();

        responsible.send(":fish:").then(async message => {
            if(message instanceof discord.Message) {
                const af = new ActiveFisher(this.getBotgartClient(), responsible, message, fish);
                message.edit(await af.createIdleEmbed());
                setTimeout(_ => af.bite(), Math.floor(Math.random() * 1000 * (WAIT_MAX_SECONDS - WAIT_MIN_SECONDS + 1) + WAIT_MIN_SECONDS));
            }
        });
    }
}

module.exports = GoFish;

