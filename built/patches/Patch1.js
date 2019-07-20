"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DBPatch_js_1 = require("./DBPatch.js");
/**
* Adds registration_role column to registrations table
* and uses 'Flussufer' as default value for all entries.
*/
class Patch1 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.columnExists("registrations", "registration_role");
        });
    }
    checkPreconditions() {
        return __awaiter(this, void 0, void 0, function* () { return this.tableExists("registrations"); });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.pragma("foreign_keys = OFF");
            // adding a column with NOT NULL constraint to an existing
            // table in SQLite requires creating a temporary table of the new format
            // and moving all the data over: https://www.sqlite.org/lang_altertable.html
            this.connection.prepare(`
            CREATE TABLE IF NOT EXISTS new_registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            api_key TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            registration_role TEXT,
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(user, guild) ON CONFLICT REPLACE,
            UNIQUE(guild, api_key)
        )`).run();
            // move the data over
            this.connection.prepare(`
            INSERT INTO new_registrations(id, user, guild, api_key, gw2account, registration_role, created)
            SELECT r.id, r.user, r.guild, r.api_key, r.gw2account, ?, r.created 
            FROM registrations AS r 
        `).run("Flussufer");
            // delete old table and rename new one
            this.connection.prepare(`DROP TABLE registrations`).run();
            this.connection.prepare(`ALTER TABLE new_registrations RENAME TO registrations`).run();
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
            CREATE TABLE IF NOT EXISTS new_registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            api_key TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(user, guild) ON CONFLICT REPLACE,
            UNIQUE(guild, api_key)
        )`).run();
            // move the data over
            this.connection.prepare(`
            INSERT INTO new_registrations(id, user, guild, api_key, gw2account, created)
            SELECT r.id, r.user, r.guild, r.api_key, r.gw2account, r.created 
            FROM registrations AS r 
        `).run();
            // delete old table and rename new one
            this.connection.prepare(`DROP TABLE registrations`).run();
            this.connection.prepare(`ALTER TABLE new_registrations RENAME TO registrations`).run();
            this.connection.pragma("foreign_keys = ON");
            this.dbcommit();
        });
    }
}
exports.Patch1 = Patch1;
