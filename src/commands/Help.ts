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
export class HelpCommand extends BotgartCommand {
    constructor() {
        super("help", {
            aliases: ["help", "commands", "hilfe"],
        },
        true, // available per DM
        true // cronable
        );
    }

    desc(): string {
        return L.get("DESC_HELP");
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        // if this command is issued on a server, only the commands the user can execute
        // are listed.
        // Issueing this command through DMs give the full list. This is not a security issue,
        // since the restricted listing is just a convenience for users to present them with a
        // more compact help text.
        let member = guild ? guild.members.find(m => m.id == responsible.id) : undefined;
        let checkPermissions = member ? member.permissions.has.bind(member.permissions) : () => true;
        let descs = "**Verfügbare Befehle:**\n\n"
                    .concat(Array.from(this.client.commandHandler.modules.values())
                        .filter(m => !m.userPermissions || checkPermissions(m.userPermissions))
                        .map(m => <BotgartCommand>m)
                        .map(m => m.desc 
                        ? "**`{0}`** (bzw. {1}): {2}".formatUnicorn(
                            m.id,
                            m.aliases.map(a => "`{0}`".formatUnicorn(a)).join(", "),
                            m.desc())
                        : m.id
                    ).join("\n\n"));

        // when having too many active commands, we could very well reach
        // the maximum message length from all the descriptions.
        // As a fallback, we break the message up to contain one command each.
        let ms = descs.length < Const.MAX_MESSAGE_LENGTH ? [descs] : descs.split("\n\n");
        ms.forEach(m => {
            this.reply(message, responsible, m).then(
                () => {},
                (err) => log("error", "Help.js", err.message) //winston.log("error", "Help.js: help-string exceeds maximum length even after splitting on command-to-command-level. One or more desc-strings seem to be too long.")
            );
        });
        if(ms.length > 1) {
            log("warn", "Help.js", "help-string exceeds maximum message length. This case is covered, but you should look into cutting down the desc-strings for some commands.");
        }
    }
}

module.exports = HelpCommand;