const { Command } = require("discord-akairo");
const schedule = require("node-schedule");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");
const {assertType, shallowInspect, log} = require.main.require("./src/Util.js");

// FIXME: move exec to command
/**
Testcases:
- schedule cron with id
- schedule cron with alias
*/
class MakeCron extends BotgartCommand {
    constructor() {
        super("makecron", {
                aliases: ["makecron", "mkcron"],
                split: "quoted",
                args: [
                    {
                        id: "schedule",
                        type: "string",
                        default: ""
                    },
                    {
                        id: "cmd",
                        type: "string" //"commandAlias"
                    },
                    {
                        id: "args",
                        match: "rest"
                    }
                ],
                userPermissions: ["ADMINISTRATOR"]
            }, 
            false, // available per DM
            false // cronable
        );
    }

    desc() {
        return L.get("DESC_MAKE_CRON");
    }

    checkArgs(args) {
        return !args || !args.schedule || !args.cmd || !args.args ? L.get("HELPTEXT_ADD_CRON") : undefined;
    }

    command(message, responsible, guild, args) {
       if(!message.member) {
            return message.author.send(L.get("NOT_AVAILABLE_AS_DM"));
        }
        
        const schedule = args.schedule;
        const cmd = args.cmd;
        const cmdargs = args.args;

        // we could use commandAlias as type for the mod parameter,
        // but then invalid commands just result in undefined.
        // That doesn't give us the opportunity to give feedback to the user what his faulty command string was.
        // So we look for the command for ourselves from a plain string.
        let mod = this.client.commandHandler.modules[cmd] || Array.from(this.client.commandHandler.modules.values()).find(m => m.aliases.includes(cmd));
        if(!mod) {
            return message.util.send(L.get("NO_SUCH_COMMAND").formatUnicorn(cmd));
        }

        // crons can not schedule other crons for shenanigans-reasons
        if(mod.id == this.id) {
            return message.util.send(L.get("CIRCULAR_CRON"));
        }

        if(!mod.cronable) {
            return message.util.send(L.get("NOT_CRONABLE"));   
        }

        return mod.parse(cmdargs, message).then( parsedArgs => {
            let checkError = mod.checkArgs(parsedArgs);
            if(checkError !== undefined) {
                return message.util.send(checkError);
            } else {
                let job = this.scheduleCronjob(schedule, message.member.user, message.guild, mod, parsedArgs);
                if(!job) {
                    return message.util.send(L.get("CRONJOB_NOT_STORED"));
                } else {
                    let cid = this.client.db.storeCronjob(schedule, 
                                                mod.id, 
                                                mod.serialiseArgs(parsedArgs), 
                                                message.member.user.id, 
                                                message.guild.id);
                    this.client.cronjobs[cid] = job;
                    log("info", "MakeCron.js", "Scheduled new cron of type '{0}' with ID {1}.".formatUnicorn(mod.id, cid));
                    return message.util.send(L.get("CRONJOB_STORED").formatUnicorn(cid));
                }
            }
        });        
    }

    /**
    * Reschedules all cronjobs that are still in the database.
    * @returns {int} - number of successfully scheduled crons.
    */
    rescheduleCronjobs() {
        let croncount = 0;
        this.client.db.getCronjobs().forEach(cron => {
            let mod = this.client.commandHandler.modules.get(cron.command);
            let args = mod.deserialiseArgs(cron.arguments || "{}"); // make sure JSON.parse works for empty command args
            let guild = this.client.guilds.find(g => g.id == cron.guild);
            if(!guild) {
                log("error", "MakeCron.js", "I am no longer member of the guild {0} the cronjob with ID {1} was scheduled for. Skipping.".formatUnicorn(cron.guild, cron.id));
            } else {
                let responsible = guild.members.find(m => m.user.id == cron.created_by);
                let job;
                if(!responsible) {
                    log("warn", "MakeCron.js", "Responsible user with ID {0} for cronjob {1} is no longer present in Guild {2}.".formatUnicorn(cron.created_by, cron.id, guild.name));
                } else {
                    job = this.scheduleCronjob(cron.schedule, responsible.user, guild, mod, args);
                }
                if(!job) {
                    log("error", "MakeCron.js", "Could not reschedule cronjob {0} although it was read from the database.".formatUnicorn(cron.id));
                } else {
                    if(cron.id in this.client.cronjobs && this.client.cronjobs[cron.id]) {
                        // just to be safe, cancel any remaining jobs before rescheduling them
                        this.client.cronjobs[cron.id].cancel();
                    }
                    this.client.cronjobs[cron.id] = job;
                    croncount++;
                    log("info", "MakeCron.js", "Rescheduled cronjob {0} of type '{1}'".formatUnicorn(cron.id, cron.command));
                }
            }
        });
        log("info", "MakeCron.js", "Done rescheduling {0} cronjobs.".formatUnicorn(croncount));
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
    scheduleCronjob(time, responsible, guild, cmd, args) {
        assertType(time, "String");
        assertType(responsible, "User");
        assertType(guild, "Guild");
        assertType(cmd, "Command");
        assertType(args, "Object");
        return schedule.scheduleJob(time, function(m,r,g,as) { 
            m.command(null,r,g,as); }.bind(this, cmd, responsible, guild, args));
    }
}

module.exports = MakeCron;