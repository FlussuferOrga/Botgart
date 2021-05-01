import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { logger } from "../Logging";

const LOG = logger();

/**
Testcases:

*/
export class DiscordLog extends BotgartCommand {
    constructor() {
        super("discordlog", {
                aliases: ["discordlog"],
                quoted: true,
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
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: true
            }
        );
    }

    command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        cl.logChannelRepository.addLogChannel(guild, args.type, args.channel);
        LOG.info("Set up log channel '{0}' for event type '{1}' in guild '{2}'.".formatUnicorn(args.channel.name, args.type, guild.name));
        (<discord.Message>message).react("✅"); // that's a white checkmark, even if not rendered properly...
    }
}

module.exports = DiscordLog;