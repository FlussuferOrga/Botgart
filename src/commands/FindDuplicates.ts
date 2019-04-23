import { Command } from "discord-akairo";
import { log } from "../Util";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

export class FindDuplicatesCommand extends BotgartCommand {
    constructor() {
        super("findduplicates", {
            aliases: ["findduplicates", "finddupes"],
            userPermissions: ['ADMINISTRATOR']
        },
        false, // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_FIND_DUPES");
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        let cl = <BotgartClient>this.client;
        cl.db.findDuplicateRegistrations().forEach(d => {
            // unknown users are already filtered out. Maybe we want to change that and notify the caller
            let users = d.users.split(",").map(u => guild.members.get(u)).filter(u => u);
            responsible.send("{0}: {1}".formatUnicorn(d.gw2account, users.join(", ")));
        });
        log("info", "FindDuplicates.js", "Finding duplicates complete.");      
    }

    postExecHook(message: discord.Message, args: any, result: any): Promise<discord.Message | discord.Message[]> {
        return message.util.send(L.get("FIND_DUPES_COMPLETE"));
    }
}