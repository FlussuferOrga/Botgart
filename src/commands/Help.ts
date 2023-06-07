import { Argument, Command } from "@notenoughupdates/discord-akairo";
import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { splitMessage } from "../util/Util";

/**
 Testcases:
 - run in channel -> bot posts a list of commands
 - run in DM -> bot posts a list of commands
 - run per cron -> bot posts a list of commands
 - run with very long help text (change desc for some commands in Locale) > 2000 chars -> response comes in parts
 - run with one very long help text (change desc for one command in Locale) > 2000 chars -> that command is omitted
 */
export class Help extends BotgartCommand {
    constructor() {
        super("help", {
                aliases: ["help", "commands", "hilfe"],
                args: [{
                    id: "command",
                    type: Argument.union("command", "commandAlias"),
                    default: "this is a string that is just a placeholder for a missing parameter :>"
                }]
            },
            {
                availableAsDM: true,
                cronable: true,
                everyonePermission: 1
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        // if this command is issued on a server, only the commands the user can execute
        // are listed.
        // Issuing this command through DMs give the full list. This is not a security issue,
        // since the restricted listing is just a convenience for users to present them with a
        // more compact help text.

        let commandId: string | null = null;
        if (args.command instanceof Command) {
            commandId = args.command.id;
        }
        const separator = "\n";
        const user: discord.GuildMember | discord.User = guild ? await guild.members.fetch(responsible.id) : responsible; // cache.find(m => m.id == responsible.id) : responsible;
        // let checkPermissions = member ? member.permissions.has.bind(member.permissions) : () => true;
        const descs = "**COMMANDS:**\n\n"
            .concat(Array.from(this.getBotgartClient().commandHandler.modules.values())
                .filter(value => commandId === null || value.id == commandId)
                .map(m => m as BotgartCommand)
                .filter(m => m.isAllowed(user))
                .sort((m1, m2) => m1.id < m2.id ? -1 : 1)
                .map(cmd => {
                        let message = "";
                        if (cmd.desc) {
                            message += `**${cmd.id}** (${cmd.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", ")}):\n${cmd.desc()}\n_ _`;
                        } else {
                            message += cmd.id;
                        }

                        // if querying for a single command, print usage.
                        if (commandId !== null) {
                            message += "\n" + cmd.usage();
                        }
                        return message;
                    }
                )
                .join(separator));

        for (const split of splitMessage(descs, { prepend: "_ _\n" })) {
            await message.reply(split);
        }
    }
}

module.exports = Help;