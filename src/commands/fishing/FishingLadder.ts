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
function pad(n: number, l: number): string {
    return " ".repeat(l - n.toString().length) + n;
}

function readableWeight(n: number): string {
    const kg: number = Math.floor(n / 1000);
    const g: number = n % 1000;
    return `${kg.toLocaleString()} kg ${g} g`;
}

export class FishingLadder extends BotgartCommand {
    constructor() {
        super("fishingladder", {
            aliases: ["fishingladder", "epeen"]
        },
        true,  // available per DM
        false, // cronable
        1 // everyone permission
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const length = 10;
        const ladder: db.FishLadderEntry[] = this.getBotgartClient().db.fishLadder(length);

        Promise.all(ladder.map(fle => this.client.users.fetch(fle.user)
                                                 .then(u => `${pad(fle.rank, 2)}: ${u.username} ${fle.number_of_fish} 🐟 (${readableWeight(fle.total_weight)})`)))
               .then(xs => message.reply(`:fish::crown:\n\`\`\`${xs.join("\n")}\`\`\``, {split:true}));
    }
}

module.exports = FishingLadder;

