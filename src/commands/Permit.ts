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
export class Permit extends BotgartCommand {
    constructor() {
        super("permit", {
            aliases: ["permit", "allow", "permission"],
            quoted: true,
            args: [
                {
                    id: "command",
                    type: "commandAlias"
                },
                {
                    id: "receiver",
                    type: (message: discord.Message, phrase: string) => { 
                        let receiver: discord.GuildMember | discord.User | discord.Role;
                        const snowflake = phrase.match(/<@[^\d]?(\d*)>/);
                        if(snowflake !== null) {
                            const snowflakeId: string = snowflake[1];                           
                            if(message.guild) {
                                // either group or guildmember
                                receiver = message.guild.roles.cache.find(r => r.id == snowflakeId) 
                                           || message.guild.members.cache.find(m => m.id == snowflakeId);
                            } else {
                                // direct message -> user 
                                receiver = this.client.users.cache.find(u => u.id == snowflakeId);
                            }    
                        } else {
                            // plaintext name -> try to resolve among guild members and roles as fallback
                            if(message.guild) {
                                receiver = message.guild.members.cache.find(m => m.displayName === phrase) 
                                            || message.guild.roles.cache.find(r => r.name === phrase) 
                            }
                        }
                        return receiver;
                    }
                },
                {
                    id: "value",
                    type: "integer",
                }
            ],
            userPermissions: ["ADMINISTRATOR"]
        },
        false, // available per DM
        true, // cronable
        0
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const cmd: string = args.command.id;
        const receiver: string = args.receiver.id;
        const type = (args.receiver instanceof discord.Role) ? PermissionTypes.role : PermissionTypes.user;
        const receiverName = (args.receiver instanceof discord.Role) ? args.receiver.name : args.receiver.displayName;
        const value = args.value;
        const perm = (<BotgartClient>this.client).db.setPermission(cmd, receiver, type, value, message.guild.id);
        this.reply(message, responsible, L.get("PERMISSION_SET_TO", [receiverName, cmd, perm])).then(
            () => {},
            (err) => log("error", "PermitCommand.js", err.message)
        );
    }
}

module.exports = Permit;
