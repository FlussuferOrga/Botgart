import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { isEmpty } from "lodash";

/**
 Testcases:
 - missing key -> feedback to user
 - existing key -> bot posts corresponding faq
 - non-existing key -> feedback to user
 */

export class GetFaq extends BotgartCommand {
    constructor() {
        super(
            "getfaq",
            {
                aliases: ["getfaq", "faq", "getrtfm", "rtfm"],
                args: [
                    {
                        id: "key",
                        type: "string",
                    },
                ],
            },
            {
                cronable: true,
                everyonePermission: 1,
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const faq = await this.getBotgartClient().faqRepository.getFAQ(args.key, guild.id);
        if (isEmpty(faq)) {
            await this.reply(message, responsible, L.get("FAQ_NOT_FOUND").formatUnicorn(args.key));
        } else {
            await this.reply(message, responsible, faq.text);
        }
    }
}

module.exports = GetFaq;
