const { Command } = require("discord-akairo");
const winston = require('winston');
const DB = require("../DB.js");
const Util = require("../Util.js");
const Const = require("../Const.js");
const L = require("../Locale.js");
const config = require("../../config.json");

class PollCommand extends Command {
    constructor() {
        super("poll", {
            aliases: ["poll","vote"],
            split: "quoted",
            args: [
                {
                    id: "channel",
                    type: "textChannel"
                },
                {
                    id: "question",
                    type: "string",
                },
                {
                    id: "emotes",
                    type: "string"
                }
            ]
        });
    }

    command(channel, question, emotes) {
        channel.send(question).then(m => {
            // filter empty strings out beforehand
            emotes.filter(react => react).forEach(react => {
                // works for standard emotes, like ":D" etc
                m.react(react).then(
                    _ => {},
                    _ => {
                        const reg = /<a?:[a-zA-Z0-9_]+:(\d+)>/;
                        const match = react.match(reg);
                        const customEmote = match ? channel.guild.emojis.find(e => e.id === match[1]) : undefined;
                        
                        // could still be garbage or from another server -> just ignore it
                        if(customEmote) {
                            // custom emote detected
                            m.react(customEmote);
                        }
                    }
                );
            });
        },
        _ => {});
    }

    exec(message, args) {
        if(!message.member) {
            return message.author.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        if(!args.channel || !args.question || !args.emotes) {
            return message.util.send(L.get("HELPTEXT_POLL"));
        }

        this.command(args.channel, args.question, args.emotes.split(" "));
        winston.log("info", "Created poll '{0}'.".formatUnicorn(args.question));
    }
}

module.exports = PollCommand;