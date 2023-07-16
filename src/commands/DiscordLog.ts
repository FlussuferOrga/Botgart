import { BotgartCommand } from "../BotgartCommand";
import { logger } from "../util/Logging";

const LOG = logger();

/**
 Testcases:

 */
export class DiscordLog extends BotgartCommand {
    constructor() {
        super(
            "discordlog",
            {
                aliases: ["discordlog"],
                channel: "guild",
                quoted: true,
                args: [
                    {
                        id: "type",
                        type: "string",
                    },
                    {
                        id: "channel",
                        type: "textChannel",
                    },
                ],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: true,
            }
        );
    }

    async command(message, responsible, guild, args) {
        const cl = this.getBotgartClient();
        cl.logChannelRepository.addLogChannel(guild, args.type, args.channel);
        LOG.info("Set up log channel '{0}' for event type '{1}' in guild '{2}'.".formatUnicorn(args.channel.name, args.type, guild.name));
        if (message) {
            await message.react("✅");
        }
    }
}

module.exports = DiscordLog;
