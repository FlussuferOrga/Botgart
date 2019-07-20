"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBPatch_js_1 = require("./DBPatch.js");
/**
* Adds the permanent_roles table.
*/
class Patch2 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return this.tableExists("permanent_roles");
    }
    apply() {
        this.dbbegin();
        this.connection.prepare(`
            CREATE TABLE IF NOT EXISTS permanent_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild TEXT NOT NULL,
                user TEXT NOT NULL,
                role TEXT NOT NULL,
                created TIMESTAMP DEFAULT (datetime('now','localtime')),
                UNIQUE(guild, user, role)
        )`).run();
    }
    revert() {
        this.dbbegin();
        this.connection.prepare(`DROP TABLE IF EXISTS permanent_roles`).run();
        this.dbcommit();
    }
    commit() { this.dbcommit(); }
    rollback() { this.dbrollback(); }
}
exports.Patch2 = Patch2;
