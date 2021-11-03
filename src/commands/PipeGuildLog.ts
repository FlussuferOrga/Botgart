import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";

/**
 Testcases:
 - run in channel -> bot posts a list of commands
 - run in DM -> bot posts a list of commands
 - run per cron -> bot posts a list of commands
 - run with very long help text (change desc for some commands in Locale) > 2000 chars -> response comes in parts
 - run with one very long help text (change desc for one command in Locale) > 2000 chars -> that command is omitted
 */
export class PipeGuildLog extends BotgartCommand {
    constructor() {
        super("pipeguildlog", {
                aliases: ["glog"],
                quoted: true,
                args: [
                    {
                        id: "guildname",
                        type: "string",
                    },
                    {
                        id: "apikey",
                        type: "string" // "commandAlias"
                    },
                    {
                        id: "channel",
                        type: "textChannel"
                    },
                ],
                // userPermissions: ["ADMINISTRATOR"]
            }
        );
    }

    checkArgs(args): string | undefined {
        return !args || !args.guildnamechannel || !args.question || !args.emotes || args.emotes.length < 1 ? L.get(this.helptextKey()) : undefined;
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {

    }
}

module.exports = PipeGuildLog;