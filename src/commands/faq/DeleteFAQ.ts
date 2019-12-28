import { Command } from "discord-akairo";
import { log } from "../../Util.js";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:
- use proper key for existing faq with multiple keys -> key is properly removed, but faq still available
- use proper key for existing faq with only one key left -> key is removed as well as whole faq
- use key that doesn't exist -> user receives corresponding feedback
- cron: all of the above
*/

export class DeleteFaq extends BotgartCommand {
    constructor() {
        super("deletefaq", {
            aliases: ["deletefaq","deletertfm","rmfaq","rmrtfm"],
            args: [
                {
                    id: "key",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        },
        false,  // available per DM
        true // cronable
        );
    }

    command(message: discord.Message , responsible: discord.User, guild: discord.Guild, args: any): boolean {
        let deleted: boolean = (<BotgartClient>this.client).db.deleteFAQ(args.key, guild.id);
        let reply: string = deleted ? L.get("FAQ_DELETED").formatUnicorn(args.key) : L.get("FAQ_NOT_DELETED").formatUnicorn(args.key);
        this.reply(message, responsible, reply)
        return deleted;
    }
}

module.exports = DeleteFaq;