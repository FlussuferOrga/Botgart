const Util = require("./Util.js");
//const sqlite3 = require("sqlite3").verbose();
const sqlite3 = require("better-sqlite3");

function execute(f) {
    let db = new sqlite3("./db/database.db", [], err => {
        if(err) {
            return console.error("DB open()", err.message);
        }
    });
    let res = f(db);

    db.close(err => {
        if(err) {
            return console.error("DB close()", err.message);
        }
    });
    return res;
}

exports.initSchema = function() {
    let sql = `
        CREATE TABLE IF NOT EXISTS registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user INT UNIQUE NOT NULL,
            api_key TEXT NOT NULL,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    execute(db => {
        db.prepare(sql).run();
    });
}

exports.storeAPIKey = function(user, key) {
    let sql = `INSERT INTO registrations(user, api_key) VALUES(?,?)
                ON CONFLICT(user) DO UPDATE SET api_key = ?, created = datetime('now', 'localtime')`;
    execute(db => {
        db.prepare(sql).run([user, key, key]);
    });
}

exports.revalidateKeys = function() {
    return execute(db => 
        Promise.all(
            db.prepare(`SELECT api_key, user FROM registrations`).all().map(r => 
                Util.validateWorld(r.api_key).then(isOnWorld => !isOnWorld ? r : undefined)
            )
        )
    );
}