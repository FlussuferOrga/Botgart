const { AkairoClient } = require("discord-akairo");
const config = require("./config.json");

const client = new AkairoClient({
    ownerID: config.owner_id,
    prefix: config.prefix,
    commandDirectory: "./src/commands/",
    inhibitorDirectory: "./src/inhibitors/",
    listenerDirectory: "./src/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
});

client.login(config.token);9