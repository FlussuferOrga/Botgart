const { Command } = require('discord-akairo');
import {BotgartCommand} from "../BotgartCommand";
import * as discord from "discord.js";
import {ClientUtil} from "discord-akairo";

class AddCommand extends BotgartCommand {
    constructor() {
        super('add', {
            aliases: ['add'],
            args: [
                 {
                    id: "channel",
                    type: "textChannel"
                 },
                {
                    id: 'numOne',
                    type: 'number',
                    default: 0
                },
                {
                    id: 'numTwo',
                    type: 'number',
                    default: 0
                },
                {
                    id: 'numThree',
                    type: 'number',
                    default: 0
                }
            ]
        });
    }

    exec(message, args) {
        const sum = args.numOne + args.numTwo + args.numThree;
        return (<discord.TextChannel>args.channel).send(`The sum is ${sum}!`);
    }
}

module.exports = AddCommand;