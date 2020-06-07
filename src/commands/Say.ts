import * as discord from "discord.js";
import { log } from "../Util";
import { BotgartCommand } from "../BotgartCommand";

/**
Testcases:
- missing parameters -> error
- regular say -> bot posts text
- with invalid channel -> error
- from cron: remove channel bot was supposed to talk in -> error
*/
export class Say extends BotgartCommand {
    constructor() {
        super("say", {
                aliases: ["say","speak"],
                quoted: true,
                args: [
                    {
                        id: "channel",
                        type: "textChannel"
                    },
                    {
                        id: "text",
                        type: "string"
                    }
                ]
            },
            {
                cronable: true
            }
        );
    }

    command(message, responsible, guild, args) {
        // Note that this callback could take place long after the cron was scheduled.
        // So the bot could no longer be there. We therefore need to find() the guild
        // again to make sure the bot is still on there.
        let result;
        let g = this.client.guilds.cache.find(g => g.id == guild.id);
        if(!g) {
            log("error", "I am not a member of guild {0}.".formatUnicorn(guild.id));
            result = false;
        } else {
            let c:discord.TextChannel = <discord.TextChannel>g.channels.cache.find(c => c.id == args.channel.id && c instanceof discord.TextChannel);
            if(!c) {
                log("error", "Can not find a channel {0}.".formatUnicorn(args.channel.id));
                result = false;
            } else {
                c.send(args.text);
                log("info", "Executed Say.");
                result = true;
            }
        }
        return result;
    }

    serialiseArgs(args) {
        let clone = Object.assign({}, args);
        clone.channel = {guild: args.channel.guild.id, channel: args.channel.id};
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        let args = JSON.parse(jsonargs);
        let guild = this.client.guilds.cache.find(g => g.id == args.channel.guild);
        args.channel = guild.channels.cache.find(c => c.id == args.channel.channel);
        return args;
    }
}

module.exports = Say;