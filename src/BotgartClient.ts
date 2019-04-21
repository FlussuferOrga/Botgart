import { AkairoClient } from "discord-akairo";
import { Database } from "./DB.js";

export class BotgartClient extends AkairoClient {
    public db: Database;
    public cronjobs: Object;

    constructor(options, dbfile) {
        super(options, {});
        this.db = new Database(dbfile, this);  
        this.cronjobs = {};
    }
}