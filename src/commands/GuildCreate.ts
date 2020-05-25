const config = require("../../config.json")
import { YES, NO } from "../Const";
import { Command, Argument } from "discord-akairo";
import { log } from "../Util";
import * as Const from "../Const";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartCommand, PermissionTypes } from "../BotgartCommand";
import { BotgartClient } from "../BotgartClient";

/**
Testcases:

*/
export class GuildCreate extends BotgartCommand {
    constructor() {
        super("createguild", {
            aliases: ["createguild", "mkguild"],
            quoted: true
                /*[
                {
                    id: "guildName",
                    type: "string"
                },
                {
                    id: "guildTag",
                    type: "string"
                },
                {
                    id: "contacts",
                    type: (message: discord.Message, phrase: string) => phrase.split(",")
                                                                              .map(s => s.trim().match(/^.+\.\d{4}$/))
                                                                              .filter(s => s !== null)
                                                                              .map(s => s[0])
                },
                {
                    id: "guildTSGroup",
                    type: "string"
                }
            ]*/
        },
        false, // available per DM
        true, // cronable
        0
        );
    }
    
    *args(message) {
        const guildName = yield { type: (m: discord.Message, p: string) => p.split(" ")
                                                                            .map(t => t.charAt(0).toUpperCase() + t.slice(1))
                                                                            .join(" ") 
                                };
        const guildTag  = yield { type: "string" };
        const contacts  = yield { type: (m: discord.Message, p: string) => p.split(",")
                                                                            .map(s => s.trim().match(/^.+\.\d{4}$/))
                                                                            .filter(s => s !== null)
                                                                            .map(s => s[0])
                               };
        const guildTSGroup = yield { type: (m: discord.Message, p: string) => p ? p : guildTag };
        const confirm = yield { type: (m: discord.Message, p: string) => {
                                        let res = undefined;
                                        if(YES.includes(p.toLowerCase())) {
                                            res = true;
                                        } else if (NO.includes(p.toLowerCase())) {
                                            res = false;
                                        }
                                        return res;
                                    },
                          prompt: {
                              start: "\n" + L.get("MK_GUILD_CONFIRM", [guildName, guildTag, contacts.join(", "), guildTSGroup]),
                              timeout: "\n" + L.get("MK_EVENT_TIMEOUT")
                          }
                        };

        return { guildName, guildTag, contacts, guildTSGroup, confirm };
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
       if(args.confirm === false) {
           message.reply(L.get("MK_GUILD_CANCELED"));
       } else if(args.confirm === true) {
           this.getBotgartClient().getTS3Connection().post("createguild", 
                                                           { 
                                                             name: args.guildName, 
                                                             tag: args.guildTag, 
                                                             tsgroup: args.guildTSGroup, 
                                                             contacts: args.contacts
                                                           });
           message.reply(L.get("MK_GUILD_COMPLETE"));
       }
    }
}

module.exports = GuildCreate;
