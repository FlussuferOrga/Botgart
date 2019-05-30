import { Command } from "discord-akairo";
import * as schedule from "node-schedule";
import * as Const from "../Const";
import * as L from "../Locale";
import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import {assertType, shallowInspect, log, resolveWvWObjective} from "../Util";

class TapReminder extends BotgartCommand {
    constructor() {
        super("tapreminder", {
                aliases: ["tapreminder", "tapped", "tap"],
                split: "quoted",
                args: [
                    {
                        id: "objective",
                        type: "string",
                        default: ""
                    }
                ],
                userPermissions: ["ADMINISTRATOR"]
            }, 
            false, // available per DM
            false // cronable
        );
    }

    desc():string {
        return L.get("DESC_TAP_REMINDER");
    }

    checkArgs(args:any): string|undefined {
        return !args || !args.objective ? L.get("HELPTEXT_TAP_REMINDER") : undefined;
    }


    command(message : discord.Message, responsible, guild, args) {
        var type_minutes: { [id: string] : number } = {
            "Camp": 50,
            "Tower": 50,
            "Keep": 50,
            "null": 1,
        }
       if(!message.member) {
            return message.author.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        
        const user_objective = args.objective;

        resolveWvWObjective(user_objective).then(([objective, map, obj_id, map_id, obj_type]) => {

            let cron_mod = this.client.commandHandler.modules["makecron"] || Array.from(this.client.commandHandler.modules.values()).find(m => m.aliases.includes("makecron")); 
            let objective_name : string = objective != null ? objective : user_objective;
            const say_text : string = L.get("TAPREMINDER_REMIND").formatUnicorn(objective_name);
            if( !(message.channel instanceof discord.TextChannel) )
                return;
            let current_channel : discord.TextChannel = message.channel;
            let exec_time : Date = new Date();
            exec_time.setMinutes(exec_time.getMinutes()+type_minutes[obj_type])

            var args: { [id: string] : any } = {
                "schedule": exec_time.toString(),
                "cmd": "say",
                "args": current_channel+" \""+say_text+"\""
            }
            let cronargs_error = cron_mod.checkArgs(args);
            if( cronargs_error !== undefined ) {
                return message.util.send(cronargs_error);
            }
            let cron_id = cron_mod.command(message, responsible, guild, args, true);
            if( cron_id < 0 ) {
                return message.util.send(L.get("TAPREMINDER_NOT_STORED"));
            }
            return message.util.send(L.get("TAPREMINDER_STORED").formatUnicorn(objective_name));
            // TODO Add Tapreminder Table (cron_id, objective_name)
            // TODO Remove Tapreminder if already exists by objective_name
        });
    }
}

module.exports = TapReminder;
