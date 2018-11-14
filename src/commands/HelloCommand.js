const { Command } = require("discord-akairo");

class HelloCommand extends Command {
    constructor() {
        super("hello", {
            aliases: ["hello"]
        });
    }

    exec(message) {
        // Also available: util.reply()
        return message.util.send("Hello!");
    }
}

module.exports = HelloCommand;