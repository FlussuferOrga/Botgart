import * as cheerio from "cheerio";
import * as discord from "discord.js";
import * as https from "https";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { Fish } from "../../repositories/FishingRepository";
import { logger } from "../../util/Logging";

/**
 Testcases:

 */
const REEL_EMOTE = "🎣";
const REEL_BASE_TIME = 5000;
const WAIT_MIN_SECONDS = 10;
const WAIT_MAX_SECONDS = 150;

async function gets(url: string, options = {}): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        https.get(url, options, (response) => {
            let body = "";
            response.on("data", (chunk) => body += chunk);
            response.on("end", () => resolve(body));
        }).on("error", reject);
    });
}

const LOG = logger();

async function image(term: string): Promise<string> {
    let image = "";

    try {
        const response = await gets(`https://www.gettyimages.de/search/2/image?phrase=${term}`, {
            headers: {
                "Accept": "text/html",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
            }
        });
        LOG.info("Page: " + response);

        const page = cheerio.load(response);

        const links = page("picture source");
        LOG.info("" + links);
        const urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr("srcset"));
        image = (urls.length === 0 ? "" : urls[Math.floor(Math.random() * urls.length)]) ?? "";
    } catch (e) {
        LOG.error(`Error while trying to retrieve random image from Dogpile: ${e}`);
    }
    return image;
}

class ActiveFisher {
    private client: BotgartClient;
    private fisher: discord.User;
    private message: discord.Message;
    private fish: Fish;
    private ended: boolean;

    public constructor(client: BotgartClient, fisher: discord.User, message: discord.Message, fish: Fish) {
        this.client = client;
        this.fisher = fisher;
        this.message = message;
        this.fish = fish;
        this.ended = false;
    }

    public async createIdleEmbed(): Promise<discord.EmbedBuilder> {
        return new discord.EmbedBuilder()
            .setTitle(L.get("FISHING_IDLE_TITLE", [], " | ", false))
            .setColor(0x0000FF)
            .setDescription(L.get("FISHING_IDLE_DESCRIPTION"))
            .setImage(await image("river"));
    }

    public async createBittenEmbed(): Promise<discord.EmbedBuilder> {
        return this.createIdleEmbed();
    }

    public async createCaughtEmbed(): Promise<discord.EmbedBuilder> {
        return new discord.EmbedBuilder()
            .setTitle(L.get("FISHING_CAUGHT_TITLE", [], " | ", false))
            .setColor(0x00FF00)
            .setDescription(L.get("FISHING_CAUGHT_DESCRIPTION"))
            .setImage(this.fish.image)
            .addFields([
                { name: ":fish:", value: `${this.fish.name}`, inline: true },
                { name: ":scales:", value: `${this.fish.weight} g`, inline: true },
                { name: ":moneybag:", value: `${this.fish.points_per_gramm * this.fish.weight}`, inline: true }
            ]);
    }

    public async createEscapedEmbed(): Promise<discord.EmbedBuilder> {
        return new discord.EmbedBuilder()
            .setTitle(L.get("FISHING_ESCAPED_TITLE", [], " | ", false))
            .setColor(0xFF0000)
            .setDescription(L.get("FISHING_ESCAPED_DESCRIPTION"))
            .setImage(await image("sunset"));
    }

    public async bite(): Promise<void> {
        await this.message.edit({ embeds: [await this.createBittenEmbed()] });
        await this.message.react(REEL_EMOTE);
        this.message.createReactionCollector({
            filter: (e, u) => u.id !== this.client.user?.id && e.emoji.name === REEL_EMOTE,
            time: REEL_BASE_TIME * this.fish.reel_time_factor
        })
            .on("collect", r => this.end(true))
            .on("end", rs => this.end(rs.size > 0));
    }

    private async end(reeled: boolean): Promise<void> {
        if (this.ended) return;
        this.ended = true;

        let embed: discord.EmbedBuilder;
        if (reeled) {
            this.client.fishingRepository.catchFish(this.fisher, this.fish);
            embed = await this.createCaughtEmbed();
        } else {
            embed = await this.createEscapedEmbed();
        }
        await this.message.edit({ embeds: [embed] });
    }
}

export class GoFish extends BotgartCommand {
    constructor() {
        super("gofish", {
                aliases: ["gofish"],
                cooldown: WAIT_MAX_SECONDS * 1000,
                ratelimit: 1
            },
            {
                availableAsDM: true,
                everyonePermission: 1
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const fish: Fish = this.getBotgartClient().fishingRepository.getRandomFish();

        await responsible.send(":fish:")
            .then(async message => {
                const af = new ActiveFisher(this.getBotgartClient(), responsible, message, fish);
                await message.edit({ embeds: [await af.createIdleEmbed()] });
                setTimeout(_ => af.bite(), Math.floor(Math.random() * 1000 * (WAIT_MAX_SECONDS - WAIT_MIN_SECONDS + 1) + WAIT_MIN_SECONDS));
            });
    }
}

module.exports = GoFish;