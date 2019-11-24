import { Command } from "discord-akairo";
import * as Util from "../../Util";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";
import moment = require('moment');

/**
Testcases:

*/
export class PermanentRoleAddCommand extends BotgartCommand {
    constructor() {
        super("addevent", {
            aliases: ["mkevent","newevent"],
            split: "quoted",
            args: [
                {
                    id: "date",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => {
                        const res = Util.parseCronDate(word);
                        return res === false ? undefined : res;
                    },
                    prompt: {
                        start: "\n" + L.get("MK_EVENT_DATE"),
                        timeout: "\n" + L.get("MK_EVENT_TIMEOUT")
                    }
                },
                {
                    id: "title",
                    type: "string",
                    prompt: {
                        start: "\n" + L.get("MK_EVENT_TITLE"),
                        timeout: "\n" + L.get("MK_EVENT_TIMEOUT")
                    }
                },
                {
                    id: "description",
                    type: "string",
                    prompt: {
                        start: "\n" + L.get("MK_EVENT_DESC"),
                        timeout: "\n" + L.get("MK_EVENT_TIMEOUT"),
                        time: 120000 // two minutes for good measure
                    }
                },
                {
                    id: "reminder",
                    type: "number",
                    prompt: {
                        start: "\n" + L.get("MK_EVENT_REMINDER"),
                        timeout: "\n" + L.get("MK_EVENT_TIMEOUT")
                    }
                }
            ],
            userPermissions: [],
        },
        false,  // available per DM
        false // cronable
        );
    }

    desc(): string {
        return L.get("DESC_ADD_EVENT");
    }

    checkArgs(args) {
        return !args 
            || !args.date 
            || !args.title 
            || !args.description === undefined 
            || !args.reminder === undefined 
            || !args.repeat === undefined 
            || !args.times === undefined
            ? L.get("HELPTEXT_ADD_EVENT") 
            : undefined;
    }    

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        let cl = <BotgartClient>this.client;
        return;
        let success = cl.db.storePermanentRole(args.member.user.id, message.guild.id, args.role.name);

    }
}

module.exports = PermanentRoleAddCommand;