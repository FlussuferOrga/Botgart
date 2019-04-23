let config = require("../config.json");
import { BotgartClient } from  "./BotgartClient";

const client = new BotgartClient({
    ownerID: config.owner_id,
    prefix: config.prefix,
    commandDirectory: "./src/commands/",
    inhibitorDirectory: "./src/inhibitors/",
    listenerDirectory: "./src/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
}, "./db/database.db");

client.login(config.token);