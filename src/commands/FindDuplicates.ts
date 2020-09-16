import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";
import { log } from "../Util";

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
        cl.registrationRepository.findDuplicateRegistrations().forEach(d => {
            // unknown users are already filtered out. Maybe we want to change that and notify the caller
            const userNames: string[] = d.users.split(",");
            Promise.all(userNames.map(async u => await guild.members.fetch(u)).filter(u => u))
            .then(users => responsible.send(`${d.gw2account}: ${users.join(", ")}`));           
        });
        log("info", "Finding duplicates complete.");      
    }

    postExecHook(message: discord.Message, args: any, result: any): void {
        message.util?.send(L.get("FIND_DUPLICATES_COMPLETE"));

    }
}

module.exports = FindDuplicates;