import { Command } from "discord-akairo";
import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../../BotgartClient";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:
- create faq properly -> faq is now present in db and available for ,faq
- use multiple keys -> faq is present in db unter multiply names
- use already existing keys -> faq is now overridden
- missing parameters -> error
*/

export class MakeFaq extends BotgartCommand {
    constructor() {
        super("addfaq", {
            aliases: ["addfaq","addrtfm"],
            quoted: true,
            args: [
                {
                    id: "keys",
                    type: (message: discord.Message, es: string) => es ? es.split(";").filter(e => e) : []
                },
                {
                    id: "text",
                    type: "string"
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        },
        {
            cronable: true
        }
        );
    }

    checkArgs(args): string|undefined {
        return !args || !args.keys || !args.text || args.keys.length < 1 ? L.get(this.helptextKey()) : undefined;
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any) {
        (<BotgartClient>this.client).db.storeFAQ(responsible.id, guild.id, args.keys, args.text);
        if(message) {
            message.util.send(L.get("FAQ_STORED"));
        } else {
            responsible.send(L.get("FAQ_STORED"));
        }
    }
}

module.exports = MakeFaq;