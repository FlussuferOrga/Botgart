import * as Const from "../../Const";
import * as L from "../../Locale";
import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";

/**
Testcases:

*/
export class TsGuildAdd extends BotgartCommand {
    constructor() {
        super("tsguildadd", {
            aliases: ["tsguildadd", "mkguild", "createguild"],
            quoted: true
        }
        );
    }
    
    *args(message) {
        const guildName = yield { type: (m: discord.Message, p: string) => p.trim()
                                                                            .split(" ")
                                                                            .map(t => t.charAt(0).toUpperCase() + t.slice(1))
                                                                            .join(" ") 
                                };
        const contacts  = yield { type: (m: discord.Message, p: string) => {
                                                                            const cs = p.split(",")
                                                                                        .map(s => s.trim().match(/^.+\.\d{4}$/))
                                                                                        .filter(s => s !== null)
                                                                                        .map((s: RegExpMatchArray) => s[0]); // regex match
                                                                            return cs.length > 0 ? cs : undefined;
                                                                          }
                               };
        const guildTSGroup = yield { type: (m: discord.Message, p: string) => p ? p : null };

        // [1] the args-method expects all arguments to be set before forwarding them to the command-method.
        // That encompasses the confirmation prompt, which yields the unwanted behaviour of issuing the 
        // mkguild command without arguments, then have the confirmation ask if it is okay to execute
        // the command with only null arguments. 
        // Instead, we want the confirmation to not pop up when no mandatory arguments are passed 
        // and have the behaviour of the other commands to display the help text. 
        // We emulate this by doing a premature check at this point and only execute the prompt function,
        // if the mandatory arguments are set.
        const present = x => x !== undefined && x !== null && !(typeof(x) === "string" && x.length === 0);
        const confirm = present(guildName) && present(contacts) 
                        ? yield { type: (m: discord.Message, p: string) => {
                                        let res: boolean | undefined = undefined;
                                        if(Const.YES.includes(p.toLowerCase())) {
                                            res = true;
                                        } else if (Const.NO.includes(p.toLowerCase())) {
                                            res = false;
                                        }
                                        return res;
                                    },
                          prompt: {
                              start: guildTSGroup
                                      ? "\n" + L.get("MK_GUILD_CONFIRM", [guildName, contacts.join(", "), guildTSGroup])
                                      : "\n" + L.get("MK_GUILD_CONFIRM_NO_GROUP", [guildName, contacts.join(", ")]),
                              timeout: "\n" + L.get("MK_EVENT_TIMEOUT")
                          }
                        }
                        : yield { type: (m: discord.Message, p: string) => undefined };

        return { guildName, contacts, guildTSGroup, confirm };
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
       if(args.confirm === false) {
           message.reply(L.get("MK_GUILD_CANCELED"));
       } else if(args.confirm === true) {
           this.getBotgartClient().getTS3Connection().post("guild", 
                                                           { 
                                                             name: args.guildName, 
                                                             tsgroup: args.guildTSGroup, 
                                                             contacts: args.contacts
                                                           })
               .then(res => message.reply(L.get("HTTP_REQUEST_RETURNED", [JSON.stringify(res)])));
           message.reply(L.get("MK_GUILD_COMPLETE"));
       } else {
           // happens mainly if the args parsing was canceled,
           // see [1]
           message.reply(L.get(this.helptextKey()));
       }
    }
}

module.exports = TsGuildAdd;
