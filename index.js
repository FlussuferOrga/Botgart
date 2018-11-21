const { AkairoClient } = require("discord-akairo");
const config = require("./config.json");
const Database = require("./src/DB.js");

class Botgart extends AkairoClient {
    constructor(options, dbfile) {
        super(options);
        this.db = new Database(dbfile, this);  
    }
}

const client = new Botgart({
    ownerID: config.owner_id,
    prefix: config.prefix,
    commandDirectory: "./src/commands/",
    inhibitorDirectory: "./src/inhibitors/",
    listenerDirectory: "./src/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
}, "./db/database.db");

client.login(config.token);