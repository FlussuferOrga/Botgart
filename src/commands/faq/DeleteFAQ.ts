import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand.js";
import * as L from "../../Locale.js";

/**
 Testcases:
 - use proper key for existing faq with multiple keys -> key is properly removed, but faq still available
 - use proper key for existing faq with only one key left -> key is removed as well as whole faq
 - use key that doesn't exist -> user receives corresponding feedback
 - cron: all of the above
 */

export default class DeleteFaq extends BotgartCommand {
    constructor() {
        super(
            "deletefaq",
            {
                aliases: ["deletefaq", "deletertfm", "rmfaq", "rmrtfm"],
                channel: "guild",
                args: [
                    {
                        id: "key",
                        type: "string",
                    },
                ],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: true,
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<boolean> {
        const deleted: boolean = (await this.getBotgartClient().faqRepository.deleteFAQ(args.key, guild.id)) ?? false;
        const reply: string = deleted ? L.get("FAQ_DELETED").formatUnicorn(args.key) : L.get("FAQ_NOT_DELETED").formatUnicorn(args.key);
        await this.reply(message, responsible, reply);
        return deleted;
    }
}
