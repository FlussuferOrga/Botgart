import { Command } from "discord-akairo";
import { log } from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";

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
        },
        true, // available per DM
        true, // cronable
        1 // everyone permission
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        // if this command is issued on a server, only the commands the user can execute
        // are listed.
        // Issueing this command through DMs give the full list. This is not a security issue,
        // since the restricted listing is just a convenience for users to present them with a
        // more compact help text.
        const separator = "\n";
        const user = guild ? guild.members.find(m => m.id == responsible.id) : responsible;
        //let checkPermissions = member ? member.permissions.has.bind(member.permissions) : () => true;
        const descs = "**COMMANDS:**\n\n"
                    .concat(Array.from(this.getBotgartClient().commandHandler.modules.values())
                        .map(m => <BotgartCommand>m)
                        .filter(m => m.isAllowed(user))
                        .sort((m1,m2) => m1.id < m2.id ? -1 : 1)
                        .map(m => m.desc 
                        ? "**`{0}`**\n({1}): {2}\n------".formatUnicorn(
                            m.id,
                            m.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", "),
                            m.desc())
                        : m.id
                    ).join(separator));

        message.reply(descs, {split: true});
    }
}

module.exports = Help;