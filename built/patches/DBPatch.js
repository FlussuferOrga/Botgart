"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Patch_js_1 = require("./Patch.js");
const sqlite3 = __importStar(require("better-sqlite3"));
class DBPatch extends Patch_js_1.Patch {
    constructor(db) {
        super();
        this.db = db;
        this.connection = sqlite3.default(this.db.file, undefined);
    }
    tableExists(name) {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(name).length > 0;
    }
    columnExists(table, column) {
        return this.connection.prepare("PRAGMA table_info(registrations)").all()
            .filter(col => col.name === "registration_role").length > 0;
    }
    dbbegin() {
        this.connection.prepare("BEGIN").run();
    }
    dbcommit() {
        this.connection.prepare("COMMIT").run();
    }
    dbrollback() {
        this.connection.prepare("ROLLBACK").run();
    }
}
exports.DBPatch = DBPatch;
