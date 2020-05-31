import { Command } from "discord-akairo";
import { log } from "../Util";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

export class FindDuplicates extends BotgartCommand {
    constructor() {
        super("findduplicates", {
            aliases: ["findduplicates", "finddupes"],
            userPermissions: ['ADMINISTRATOR']
        }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const cl = this.getBotgartClient();
        cl.db.findDuplicateRegistrations().forEach(d => {
            // unknown users are already filtered out. Maybe we want to change that and notify the caller
            const userNames: string[] = d.users.split(",");
            Promise.all(userNames.map(async u => await guild.members.fetch(u)).filter(u => u))
            .then(users => responsible.send(`${d.gw2account}: ${users.join(", ")}`));           
        });
        log("info", "FindDuplicates.js", "Finding duplicates complete.");      
    }

    postExecHook(message: discord.Message, args: any, result: any): Promise<discord.Message | discord.Message[]> {
        return message.util.send(L.get("FIND_DUPLICATES_COMPLETE"));
    }
}

module.exports = FindDuplicates;