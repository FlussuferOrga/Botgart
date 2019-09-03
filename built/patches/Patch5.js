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
* Adds the discord_log_channels table.
*/
class Patch5 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.tableExists("discord_log_channels");
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`
            CREATE TABLE discord_log_channels(
              discord_log_channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
              guild TEXT NOT NULL,
              type TEXT NOT NULL,
              channel TEXT NOT NULL
            )`).run();
        });
    }
    revert() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`DROP TABLE IF EXISTS discord_log_channels`).run();
            this.dbcommit();
        });
    }
}
exports.Patch5 = Patch5;
