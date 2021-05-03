import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import { FishLadderEntry } from "../../repositories/FishingRepository";

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
            {
                availableAsDM: true,
                everyonePermission: 1
            }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const length = 10;
        const ladder: FishLadderEntry[] = this.getBotgartClient().fishingRepository.fishLadder(length);

        Promise.all(ladder.map(fle => this.client.users.fetch(fle.user)
            .then(u => `\`${pad(fle.rank, 2)}\` ${u.username}: ${fle.number_of_fish} × 🐟 (${readableWeight(fle.total_weight)})`)))
            .then(xs => message.reply(`:fish::crown:\n${xs.join("\n")}`, {split: true}));
    }
}

module.exports = FishingLadder;

