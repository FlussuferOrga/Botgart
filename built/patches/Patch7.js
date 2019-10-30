"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DBPatch_js_1 = require("./DBPatch.js");
/**
* Adds the year column to the reset_roster table
*/
class Patch7 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.columnExists("reset_rosters", "year");
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.pragma("foreign_keys = OFF");
            // adding a column with NOT NULL constraint to an existing
            // table in SQLite requires creating a temporary table of the new format
            // and moving all the data over: https://www.sqlite.org/lang_altertable.html
            this.connection.prepare(`
            CREATE TABLE new_reset_rosters(
              reset_roster_id INTEGER PRIMARY KEY AUTOINCREMENT, 
              week_number INTEGER NOT NULL,
              year INTEGER NOT NULL,
              guild TEXT NOT NULL,
              channel TEXT NOT NULL,
              message TEXT NOT NULL,
              UNIQUE(guild, year, week_number)         
            )`).run();
            // move the data over
            this.connection.prepare(`
            INSERT INTO new_reset_rosters(reset_roster_id, week_number, year, guild, channel, message)
            SELECT rr.reset_roster_id, rr.week_number, ?, rr.guild, rr.channel, rr.message
            FROM reset_rosters AS rr
        `).run(2019);
            // delete old table and rename new one
            this.connection.prepare(`DROP TABLE reset_rosters`).run();
            this.connection.prepare(`ALTER TABLE new_reset_rosters RENAME TO reset_rosters`).run();
            this.connection.pragma("foreign_keys = ON");
        });
    }
    revert() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.pragma("foreign_keys = OFF");
            // adding a column with NOT NULL constraint to an existing
            // table in SQLite requires creating a temporary table of the new format
            // and moving all the data over: https://www.sqlite.org/lang_altertable.html
            this.connection.prepare(`
            CREATE TABLE new_reset_rosters(
              reset_roster_id INTEGER PRIMARY KEY AUTOINCREMENT, 
              week_number INTEGER NOT NULL,
              guild TEXT NOT NULL,
              channel TEXT NOT NULL,
              message TEXT NOT NULL,
              UNIQUE(guild, year, week_number)         
            )`).run();
            // move the data over
            this.connection.prepare(`
            INSERT INTO new_reset_rosters(reset_roster_id, week_number, guild, channel, message)
            SELECT rr.reset_roster_id, rr.week_number, rr.guild, rr.channel, rr.message
            FROM reset_rosters AS rr
        `).run();
            // delete old table and rename new one
            this.connection.prepare(`DROP TABLE reset_rosters`).run();
            this.connection.prepare(`ALTER TABLE new_reset_rosters RENAME TO reset_rosters`).run();
            this.connection.pragma("foreign_keys = ON");
        });
    }
}
exports.Patch7 = Patch7;
