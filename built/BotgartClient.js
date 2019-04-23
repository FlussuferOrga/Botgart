"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
const DB_js_1 = require("./DB.js");
class BotgartClient extends discord_akairo_1.AkairoClient {
    constructor(options, dbfile) {
        super(options, {});
        this.db = new DB_js_1.Database(dbfile, this);
        this.cronjobs = {};
    }
}
exports.BotgartClient = BotgartClient;
