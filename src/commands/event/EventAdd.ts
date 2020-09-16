import * as Util from "../../Util";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";


/**
Testcases:

*/
export class AddEvent extends BotgartCommand {
    constructor() {
        super("addevent", {
            aliases: ["mkevent","newevent"],
            quoted: true,
            args: [
                {
                    id: "date",
                    type: (message: discord.Message, phrase: string) => {
                        const res = Util.parseCronDate(phrase);
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
        }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        let cl = <BotgartClient>this.client;
        return;
        
    }

    private createEventPost(date: Date, title: string, description: string) {

    }

    private updateEventPosts() {

    }
}

module.exports = AddEvent;