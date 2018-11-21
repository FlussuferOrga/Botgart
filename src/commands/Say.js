const { Command } = require("discord-akairo");
const winston = require("winston");
const DB = require.main.require("./src/DB.js");
const { assertType, shallowInspect } = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");

/**
Testcases:
- missing parameters -> error
- regular say -> bot posts text
- with invalid channel -> error
- from cron: remove channel bot was supposed to talk in -> error
*/
class SayCommand extends BotgartCommand {
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
            true // cronable
        );
    }

    desc() {
        return L.get("DESC_SAY");
    }

    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        assertType(args.channel, "TextChannel");
        assertType(args.text, "String");
        // Note that this callback could take place long after the cron was scheduled.
        // So the bot could no longer be there. We therefore need to find() the guild
        // again to make sure the bot is still on there.
        let result;
        let g = this.client.guilds.find(g => g.id === guild.id);
        if(!g) {
            winston.log("error", "Say.js: I am not a member of guild {0}.".formatUnicorn(guild.id));
            result = false;
        } else {
            let c = g.channels.find(c => c.id === args.channel.id);
            if(!c) {
                winston.log("error", "Say.js: Can not find a channel {0}.".formatUnicorn(args.channel.id));
                result = false;
            } else {
                c.send(args.text);
                winston.log("info", "Say.js: Executed Say.");
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
        let guild = this.client.guilds.find(g => g.id === args.channel.guild);
        args.channel = guild.channels.find(c => c.id === args.channel.channel);
        return args;
    }
}

module.exports = SayCommand;