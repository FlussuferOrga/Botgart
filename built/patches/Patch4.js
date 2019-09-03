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
* Adds the command_permissions table.
*/
class Patch4 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.tableExists("command_permissions") && this.viewExists("command_permissions_agg");
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`
            CREATE TABLE command_permissions(
              command_permissions_id INTEGER PRIMARY KEY AUTOINCREMENT,
              command TEXT NOT NULL, -- primary name of the command
              receiver TEXT NOT NULL, -- either a unique user ID or a unique role ID. Discord uses Twitter-Snowflakes as IDs, so they should be compatible with each other and still unique https://discordapp.com/developers/docs/reference
              type TEXT NOT NULL, 
              guild TEXT NOT NULL,
              value INTEGER NOT NULL, -- a positive or negative value to either allow or forbid the command
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- when this permission was granted
              UNIQUE(command, receiver),
              CHECK(type IN ('user','role','other'))
            )`).run();
            this.connection.prepare(`
            CREATE VIEW command_permissions_agg(command, receiver, type, guild, value) AS 
              SELECT 
                cp.command,
                cp.receiver,
                cp.type,
                cp.guild,
                SUM(cp.value)
              FROM 
                command_permissions AS cp 
              GROUP BY 
                cp.command, cp.receiver, cp.type, cp.guild
            `).run();
        });
    }
    revert() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`DROP VIEW IF EXISTS command_permissions_agg`).run();
            this.connection.prepare(`DROP TABLE IF EXISTS command_permissions`).run();
            this.dbcommit();
        });
    }
}
exports.Patch4 = Patch4;
