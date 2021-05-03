import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";

/**
 Testcases:
 - missing key -> feedback to user
 - existing key -> bot posts corresponding faq
 - non-existing key -> feedback to user
 */

export class GetFaq extends BotgartCommand {
    constructor() {
        super("getfaq", {
                aliases: ["getfaq", "faq", "getrtfm", "rtfm"],
                args: [
                    {
                        id: "key",
                        type: "string"
                    }
                ]
            },
            {
                cronable: true,
                everyonePermission: 1
            }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): void {
        const faq = this.getBotgartClient().faqRepository.getFAQ(args.key, guild.id);
        const response = faq ? faq.text : L.get("FAQ_NOT_FOUND").formatUnicorn(args.key);
        this.reply(message, responsible, response);
    }
}

module.exports = GetFaq;