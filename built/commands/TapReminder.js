"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schedule = __importStar(require("node-schedule"));
const L = __importStar(require("../Locale"));
const discord = __importStar(require("discord.js"));
const BotgartCommand_1 = require("../BotgartCommand");
const Util_1 = require("../Util");
class TapReminder extends BotgartCommand_1.BotgartCommand {
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
        }, false, // available per DM
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_TAP_REMINDER");
    }
    checkArgs(args) {
        return !args || !args.objective ? L.get("HELPTEXT_TAP_REMINDER") : undefined;
    }
    command(message, responsible, guild, args) {
        var type_minutes = {
            "Camp": 55,
            "Tower": 53,
            "Keep": 50,
            "null": 1,
        };
        if (!message.member) {
            return message.author.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        const user_objective = args.objective;
        Util_1.resolveWvWObjective(user_objective).then(([objective, map, obj_id, map_id, obj_type]) => {
            let cron_mod = this.client.commandHandler.modules["makecron"] || Array.from(this.client.commandHandler.modules.values()).find(m => m.aliases.includes("makecron"));
            let say_mod = this.client.commandHandler.modules["say"] || Array.from(this.client.commandHandler.modules.values()).find(m => m.aliases.includes("say"));
            let objective_name = objective != null ? objective : user_objective;
            const say_text = L.get("TAPREMINDER_REMIND").formatUnicorn(objective_name);
            if (!(message.channel instanceof discord.TextChannel))
                return;
            let current_channel = message.channel;
            let exec_time = new Date();
            exec_time.setMinutes(exec_time.getMinutes() + type_minutes[obj_type]);
            const cmd_args = "\"" + exec_time + "\" ,say #" + current_channel + " \"" + say_text + "\"";
            var args = {
                "schedule": exec_time.toString(),
                "cmd": "say",
                "args": current_channel + " \"" + say_text + "\""
            };
            console.log(args);
            let cronargs_error = cron_mod.checkArgs(args);
            if (cronargs_error !== undefined) {
                return message.util.send(cronargs_error);
            }
            cron_mod.command(message, responsible, guild, args);
            return;
            if (!say_mod) {
                return message.util.send(L.get("NO_SUCH_COMMAND").formatUnicorn("say"));
            }
            if (!say_mod.cronable) {
                return message.util.send(L.get("NOT_CRONABLE"));
            }
            return say_mod.parse(cmd_args, message).then(parsedArgs => {
                let checkError = say_mod.checkArgs(parsedArgs);
                if (checkError !== undefined) {
                    // The scheduled command cannot be executed, wrong arguments.
                    return message.util.send(checkError);
                }
                let schedule = this.scheduleTapReminder(exec_time, message.member.user, message.guild, say_mod, parsedArgs);
                if (!schedule)
                    return message.util.send(L.get("TAPREMINDER_NOT_STORED"));
                return message.util.send(L.get("TAPREMINDER_STORED").formatUnicorn(objective_name));
            });
            /*
            Note:
            Ich bin leider kein großer fan von der findBestMatch-Methode.
            Ich kann da totalen gibberisch eingeben und er findet immer ein passendes objective. Dadurch kann man schnell mal gespeicherte tappings versehentlich überschreiben oder zu total komischen Sachen remindet werden. Ich mache hier erstmal noch eine überprüfung, ob der string vom nutzer überhaupt Teil des objectives ist. Ansonsten wird einfach nur der custom Text genutzt.
            Der Map Name ist Imo auch unnötig, da die Namen der objectives über alle Maps eindeutig ist.
            TODO: WT, NL, OT, MFHome, MFEBG sollten alles eindeutige aliase sein.
            
            TODO: Add Database save functionality
            
            TODO: Sehr sehr ähnlich zu MakeCron. Ist es vlt. möglich eine Teil von MakeCron in eine statische methode zu schieben und diese von hier aus aufzurufen? Theoretisch müsste er lediglich für den Time-String ein Date akzeptieren.
            */
            return message.util.send(user_objective + objective + "obj_id " + obj_id + " map " + map + map_id + obj_type + "Minutes: " + type_minutes[obj_type]);
        });
        /*
                return mod.parse(cmdargs, message).then( parsedArgs => {
                    let checkError = mod.checkArgs(parsedArgs);
                    if(checkError !== undefined) {
                        return message.util.send(checkError);
                    } else {
                        let cl = <BotgartClient>this.client;
                        let job = this.scheduleCronjob(schedule, message.member.user, message.guild, mod, parsedArgs);
                        if(!job) {
                            return message.util.send(L.get("CRONJOB_NOT_STORED"));
                        } else {
                            let cid = cl.db.storeCronjob(schedule,
                                                        mod.id,
                                                        mod.serialiseArgs(parsedArgs),
                                                        message.member.user.id,
                                                        message.guild.id);
                            cl.cronjobs[cid] = job;
                            log("info", "TapReminder.js", "Scheduled new cron of type '{0}' with ID {1}.".formatUnicorn(mod.id, cid));
                            return message.util.send(L.get("CRONJOB_STORED").formatUnicorn(cid, job.nextInvocation));
                        }
                    }
                });
                */
    }
    /**
    * Reschedules all cronjobs that are still in the database.
    * @returns {int} - number of successfully scheduled crons.
    */
    rescheduleCronjobs() {
        let croncount = 0;
        let cl = this.client;
        cl.db.getCronjobs().forEach(cron => {
            let mod = this.client.commandHandler.modules.get(cron.command);
            let args = mod.deserialiseArgs(cron.arguments || "{}"); // make sure JSON.parse works for empty command args
            let guild = this.client.guilds.find(g => g.id == cron.guild);
            if (!guild) {
                Util_1.log("error", "TapReminder.js", "I am no longer member of the guild {0} the cronjob with ID {1} was scheduled for. Skipping.".formatUnicorn(cron.guild, cron.id));
            }
            else {
                let responsible = guild.members.find(m => m.user.id == cron.created_by);
                let job;
                if (!responsible) {
                    Util_1.log("warn", "TapReminder.js", "Responsible user with ID {0} for cronjob {1} is no longer present in Guild {2}.".formatUnicorn(cron.created_by, cron.id, guild.name));
                }
                else {
                    job = this.scheduleTapReminder(cron.schedule, responsible.user, guild, mod, args);
                }
                if (!job) {
                    Util_1.log("error", "TapReminder.js", "Could not reschedule cronjob {0} although it was read from the database.".formatUnicorn(cron.id));
                }
                else {
                    if (cron.id in cl.cronjobs && cl.cronjobs[cron.id]) {
                        // just to be safe, cancel any remaining jobs before rescheduling them
                        cl.cronjobs[cron.id].cancel();
                    }
                    cl.cronjobs[cron.id] = job;
                    croncount++;
                    Util_1.log("info", "TapReminder.js", "Rescheduled cronjob {0} of type '{1}'".formatUnicorn(cron.id, cron.command));
                }
            }
        });
        Util_1.log("info", "TapReminder.js", "Done rescheduling {0} cronjobs.".formatUnicorn(croncount));
        return croncount;
    }
    /**
    * Schedules a new cronjob.
    * That is: it creates a cronjob, no database is involved at this point.
    * @param {string} time - cron string.
    * @param {User} responsible - who issued the cron.
    * @param {Guild} guild - Guild.
    * @param {Command} cmd - Command-module to execute.
    * @param {Map} args - Args for the command.
    * @returns {scheduleJob}
    */
    scheduleTapReminder(time, responsible, guild, cmd, args) {
        return schedule.scheduleJob(time, function (m, r, g, as) {
            m.command(null, r, g, as);
        }.bind(this, cmd, responsible, guild, args));
    }
}
module.exports = TapReminder;
