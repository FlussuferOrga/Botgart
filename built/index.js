"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let config = require("../config.json");
const BotgartClient_1 = require("./BotgartClient");
const client = new BotgartClient_1.BotgartClient({
    ownerID: config.owner_id,
    prefix: config.prefix,
    commandDirectory: "./src/commands/",
    inhibitorDirectory: "./src/inhibitors/",
    listenerDirectory: "./src/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
}, "./db/database.db");
client.login(config.token);
