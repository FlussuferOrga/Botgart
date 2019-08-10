"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    commit() {
        return __awaiter(this, void 0, void 0, function* () { this.dbcommit(); });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () { this.dbrollback(); });
    }
    viewExists(name) {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='view' AND name=?").all(name).length > 0;
    }
    tableExists(name) {
        return this.connection.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(name).length > 0;
    }
    columnExists(table, column) {
        return this.connection.prepare("PRAGMA table_info(" + table + ")").all() // can't use prepared parameters for some reason in this instance
            .filter(col => col.name === column).length > 0;
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
