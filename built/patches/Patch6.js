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
* Adds the tables for reset lead rostering
*/
class Patch6 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.tableExists("reset_leaders") && this.tableExists("reset_rosters");
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`
            CREATE TABLE reset_rosters(
              reset_roster_id INTEGER PRIMARY KEY AUTOINCREMENT, 
              week_number INTEGER NOT NULL,
              guild TEXT NOT NULL,
              channel TEXT NOT NULL,
              message TEXT NOT NULL         
            )`).run();
            this.connection.prepare(`
            CREATE TABLE reset_leaders(
              reset_leader_id INTEGER PRIMARY KEY AUTOINCREMENT,
              reset_roster_id INTEGER,
              player TEXT NOT NULL,
              FOREIGN KEY(reset_roster_id) REFERENCES reset_rosters(reset_roster_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE              
            )`).run();
        });
    }
    revert() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`DROP TABLE IF EXISTS reset_leaders`).run();
            this.connection.prepare(`DROP TABLE IF EXISTS reset_rosters`).run();
            this.dbcommit();
        });
    }
}
exports.Patch6 = Patch6;
