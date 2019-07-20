"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const DBPatch_js_1 = require("./DBPatch.js");
const await_semaphore_1 = require("await-semaphore");
/**
* Adds the account-name column to the registrations table and populates it.
*/
class Patch3 extends DBPatch_js_1.DBPatch {
    constructor(db) {
        super(db);
    }
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.columnExists("registrations", "account_name");
        });
    }
    resolveAccountNames(rows) {
        var rows_1, rows_1_1;
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let semaphore = new await_semaphore_1.Semaphore(10);
            try {
                for (rows_1 = __asyncValues(rows); rows_1_1 = yield rows_1.next(), !rows_1_1.done;) {
                    let r = rows_1_1.value;
                    let release = yield semaphore.acquire();
                    let accname = yield Util_1.getAccountName(r.api_key);
                    if (accname === false) {
                        accname = "INVALID API KEY"; // doesn't matter, will be deleted in next reauth anyway.
                    }
                    release();
                    console.log("resolved " + accname);
                    this.connection.prepare(`INSERT INTO new_registrations(id, user, guild, api_key, gw2account, registration_role, account_name, created)
                                     VALUES(?,?,?,?,?,?,?,?)`)
                        .run(r.id, r.user, r.guild, r.api_key, r.gw2account, r.registration_role, accname, r.created);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (rows_1_1 && !rows_1_1.done && (_a = rows_1.return)) yield _a.call(rows_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
            let con = this.connection;
            this.dbbegin();
            con.pragma("foreign_keys = OFF");
            // adding a column with NOT NULL constraint to an existing
            // table in SQLite requires creating a temporary table of the new format
            // and moving all the data over: https://www.sqlite.org/lang_altertable.html
            con.prepare(`
            CREATE TABLE IF NOT EXISTS new_registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            api_key TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            registration_role TEXT NOT NULL,
            account_name TEXT,
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(user, guild) ON CONFLICT REPLACE,
            UNIQUE(guild, api_key)
        )`).run();
            yield this.resolveAccountNames(con.prepare(`SELECT * FROM registrations`).all());
            return;
            // delete old table and rename new one
            con.prepare(`DROP TABLE registrations`).run();
            con.prepare(`ALTER TABLE new_registrations RENAME TO registrations`).run();
            con.pragma("foreign_keys = ON");
        });
    }
    checkPostconditions() {
        return __awaiter(this, void 0, void 0, function* () {
            const oldCount = this.connection.prepare(`SELECT COUNT(*) AS c FROM registrations`).get().c;
            const newCount = this.connection.prepare(`SELECT COUNT(*) AS c FROM new_registrations`).get().c;
            const post = oldCount === newCount;
            if (!post) {
                Util_1.log("error", "Patch3.js", "Expected equal number of entries for old and new table. But old table had {0} entries while new has {1}. Reverting.".formatUnicorn(oldCount, newCount));
            }
            return;
        });
    }
    revert() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbbegin();
            this.connection.prepare(`DROP TABLE IF EXISTS permanent_roles`).run();
            this.dbcommit();
        });
    }
}
exports.Patch3 = Patch3;
