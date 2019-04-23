"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let config = require("../config.json");
const BotgartClient_1 = require("./BotgartClient");
const client = new BotgartClient_1.BotgartClient({
    ownerID: config.owner_id,
    prefix: config.prefix,
    commandDirectory: "./built/commands/",
    inhibitorDirectory: "./built/inhibitors/",
    listenerDirectory: "./built/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
}, "./db/database.db");
console.log("Starting up...");
client.login(config.token);
console.log("Started up...");
