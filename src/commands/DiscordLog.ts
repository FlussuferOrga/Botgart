import * as discord from "discord.js";
import { Command } from "discord-akairo";
import { log } from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:

*/
export class DiscordLogCommand extends BotgartCommand {
    constructor() {
        super("discordlog", {
                aliases: ["discordlog"],
                split: "quoted",
                args: [
                    {
                        id: "type",
                        type: "string"
                    },
                    {
                        id: "channel",
                        type: "textChannel"
                    }
                    
                ],
                userPermissions: ["ADMINISTRATOR"]
            },
            false, // available per DM
            true, // cronable
            0, // everyone permission
        );
    }

    desc() {
        return L.get("DESC_DISCORD_LOG");
    }

    command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        cl.db.addLogChannel(guild, args.type, args.channel);
        log("notice", "DiscordLog.js", "Set up log channel '{0}' for event type '{1}' in guild '{2}'.".formatUnicorn(args.channel.name, args.type, guild.name));
        (<discord.Message>message).react("✅"); // that's a white checkmark, even if not rendered properly...
    }

    checkArgs(args) {
        return !args || !args.channel || !args.type ?  L.get("HELPTEXT_DISCORD_LOG") : undefined;
    }
}

module.exports = DiscordLogCommand;