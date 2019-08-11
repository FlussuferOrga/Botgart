import * as discord from "discord.js";
import { Command } from "discord-akairo";
import { log } from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:
- missing parameters -> error
- regular say -> bot posts text
- with invalid channel -> error
- from cron: remove channel bot was supposed to talk in -> error
*/
export class SayCommand extends BotgartCommand {
    constructor() {
        super("say", {
                aliases: ["say","speak"],
                split: "quoted",
                args: [
                    {
                        id: "channel",
                        type: "textChannel"
                    },
                    {
                        id: "text",
                        type: "string"
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
        return L.get("DESC_SAY");
    }

    command(message, responsible, guild, args) {
        // Note that this callback could take place long after the cron was scheduled.
        // So the bot could no longer be there. We therefore need to find() the guild
        // again to make sure the bot is still on there.
        let result;
        let g = this.client.guilds.find(g => g.id == guild.id);
        if(!g) {
            log("error", "Say.js", "I am not a member of guild {0}.".formatUnicorn(guild.id));
            result = false;
        } else {
            let c:discord.TextChannel = <discord.TextChannel>g.channels.find(c => c.id == args.channel.id && c instanceof discord.TextChannel);
            if(!c) {
                log("error", "Say.js", "Can not find a channel {0}.".formatUnicorn(args.channel.id));
                result = false;
            } else {
                c.send(args.text);
                log("info", "Say.js", "Executed Say.");
                result = true;
            }
        }
        return result;
    }

    checkArgs(args) {
        return !args || !args.channel || !args.text ?  L.get("HELPTEXT_SAY") : undefined;
    }

    serialiseArgs(args) {
        let clone = Object.assign({}, args);
        clone.channel = {guild: args.channel.guild.id, channel: args.channel.id};
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        let args = JSON.parse(jsonargs);
        let guild = this.client.guilds.find(g => g.id == args.channel.guild);
        args.channel = guild.channels.find(c => c.id == args.channel.channel);
        return args;
    }
}

module.exports = SayCommand;