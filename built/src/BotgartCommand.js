"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
class BotgartCommand extends discord_akairo_1.Command {
    constructor(id, options, availableAsDM = false, cronable = true) {
        super(id, options);
        this.availableAsDM = availableAsDM;
        this.cronable = cronable;
    }
    /**
    * Creates a decription for this command for help-listing.
    * Note that "description" is already taken somehow.
    * returns - description of this command.
    */
    desc() {
        return "";
    }
    /**
    * Checks the arguments of exec() for validity.
    * Having valid arguments should return undefined
    * (default behaviour), while missing or malformed
    * arguments should result in an error message.
    * This method will be called by cronjobs to validate
    * that commands are executed with proper arguments.
    * @param args - arguments to the command.
    * @returns error-string in case of malformed args, else undefined.
    */
    checkArgs(args) {
        return undefined;
    }
    /**
    * This is the method that should actually do the whole execution.
    * Ideally, exec() just calls this without doing anything else.
    * That's important to make Commands seemlessly available through
    * cronjobs, where no context like a Message is available.
    * Discord objects like Guilds and Channels should also be resolved
    * within this method to verify that they still exist.
    * A user could have scheduled a cronjob a week before and since then
    * the bot may have been kicked from the Guild or the channel could have
    * been deleted.
    * @param {Message} message - Message that triggered this command.
                                 If the command is run as a cron, this parameter will be null.
                                 Each command must check the validity of this parameter themselves if needed.
    * @param {User} responsible - the User responsible for this command.
                                  Either caller or whoever created the cronjob this command is running in.
                                  Note the this could fail to resolve and should always be checked for null.
    * @param {Guild} guild - the Guild on which to execute the command.
    * @param {map} args - arguments for the command. Each command specifies the format themselves.
    */
    command(message, responsible, guild, args) {
        throw "command() not implemented.";
    }
    /**
    * Serialises a map of command arguments to a string for store
    * it properly in the database.
    * In many cases, the default implementation will suffice.
    * But when complex objects from discord.js with cycles will not fit comfortably
    * into the DB, so we only store their ID. Each command will have to manually
    * do that additional work.
    * NOTE: serialiseArgs may _not_ modify the arguments by reference!
    * @param {Map} args - arguments to serialise to the DB.
    * @returns {string}
    */
    serialiseArgs(args) {
        return JSON.stringify(args);
    }
    /*
    * Inverse to serialiseArgs. Has to revert everything that was done there.
    * @param {string} jsonargs - serialised JSON arguments for the command.
    * NOTE: deserialiseArgs may _not_ modify the arguments by reference!
    * @returns {Map}
    */
    deserialiseArgs(jsonargs) {
        return JSON.parse(jsonargs);
    }
    /**
    * Default implementation of Command.exec() for cron-able commands:
    *
    * 1. Deny DM-execution (if the command is not available as DM, which most are not).
    * 2. Check, if the arguments are not only syntactically, but semantically correct, if not, error out.
    * 3. Call command().
    *
    * This behaviour can of course be overridden on a case-to-case basis.
    *
    * @param {Message} message - message that triggered this command.
    * @param {Object} args - parameters.
    */
    exec(message, args) {
        if (!this.availableAsDM && !message.member) {
            message.util.send(L.get("NOT_AVAILABLE_AS_DM"));
            return;
        }
        let errorMessage = this.checkArgs(args);
        if (errorMessage) {
            message.util.send(errorMessage);
            return;
        }
        let res = this.command(message, message.author, message.guild, args);
        return this.postExecHook(message, args, res);
    }
    /**
    * Optional method that is called in the default implementation of exec().
    * This is useful for when directly invoking this command on a server should
    * have slightly different behaviour than doing it from a cron (eg giving the user feedback).
    * @param {Message} message - the Message as passed to exec().
    * @param {Map} args - the arguments as passed to exec().
    * @param {any} result - the result from command().
    * @returns {any} - is returned to the caller.
    */
    postExecHook(message, args, result) { }
    /*
    * Convenience method to reply from within a command.
    * If a message is present, the bot will reply to where
    * the message was received.
    * Else, it will send a DM to the responsible person.
    * This is relevent when a command is scheduled as cron
    * where a message to reply to is not available.
    * @param {Message} message - the message to reply to, may be null.
    * @param {User} responsible - the person responsible for the execution of the command.
    * @param response - the message text to send to the user.
    * @returns {Promise} - the promise for whichever method was executed.
    */
    reply(message, responsible, response) {
        if (message) {
            return message.channel.send(response);
        }
        else {
            return responsible.send(response);
        }
    }
}
exports.BotgartCommand = BotgartCommand;
