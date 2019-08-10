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
export class PermitCommand extends BotgartCommand {
    constructor() {
        super("permit", {
            aliases: ["permit", "allow", "permission"],
            split: "quoted",
            args: [
                {
                    id: "command",
                    type: "commandAlias"
                },
                {
                    id: "receiver",
                    type: (word: string, message: discord.Message, prevArgs: any[]) => { 
                        let receiver;
                        const snowflake = word.match(/<@(&)?(\d*)>/);
                        if(snowflake !== null) {
                            const isGroup: boolean = snowflake[1] !== undefined;
                            const snowflakeId: string = snowflake[2];                           
                            if(message.guild) {
                                // either group or guildmember
                                receiver = isGroup 
                                            ? message.guild.roles.find(r => r.id === snowflakeId)
                                            : message.guild.members.find(m => m.id === snowflakeId);    
                            } else {
                                // direct message -> user 
                                receiver = this.client.users.find(u => u.id === snowflakeId);
                            }    
                        } else {
                            // plaintext name -> try to resolve among guild members and roles as fallback
                            if(message.guild) {
                                receiver = message.guild.members.find(m => m.displayName === word) 
                                            || message.guild.roles.find(r => r.name === word) 
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
        1
        );
    }

    checkArgs(args) {
        return !args || !args.command || !args.receiver || args.value === undefined ? L.get("HELPTEXT_PERMIT") : undefined;
    }

    desc(): string {
        return L.get("DESC_PERMIT");
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

module.exports = PermitCommand;
