import discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand.js";
import { FishLadderEntry } from "../../repositories/FishingRepository.js";
import { splitMessage } from "../../util/Util.js";

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

export default class FishingLadder extends BotgartCommand {
    constructor() {
        super(
            "fishingladder",
            {
                aliases: ["fishingladder", "epeen"],
            },
            {
                everyonePermission: 1,
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const length = 10;
        const ladder: FishLadderEntry[] = await this.getBotgartClient().fishingRepository.fishLadder(length);

        Promise.all(
            ladder.map((fle) =>
                this.client.users
                    .fetch(fle.user)
                    .then((u) => `\`${pad(fle.rank, 2)}\` ${u.username}: ${fle.number_of_fish} × 🐟 (${readableWeight(fle.total_weight)})`)
            )
        ).then(async (xs) => {
            const messageParts = splitMessage(`:fish::crown:\n${xs.join("\n")}`);
            for (const part of messageParts) {
                await message.reply(part);
            }
        });
    }
}
