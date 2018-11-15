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
            gw2account TEXT UNIQUE NOT NULL,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    execute(db => {
        db.prepare(sql).run();
    });
}

exports.storeAPIKey = function(user, key, gw2account) {
    let sql = `INSERT INTO registrations(user, api_key, gw2account) VALUES(?,?,?)
                ON CONFLICT(user) DO UPDATE SET api_key = ?, created = datetime('now', 'localtime')`;
    execute(db => {
        db.prepare(sql).run([user, key, gw2account, key]);
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

exports.deleteKey = function(key) {
    let sql = `DELETE FROM registrations WHERE api_key = ?`;
    execute(db => db.prepare(sql).run(key));
}


exports.dummy = function() {
    let sql = `INSERT INTO registrations(user, api_key, gw2account) VALUES
    (?,?,?),
    (?,?,?)
    `;
    execute(db => db.prepare(sql).run([
        100, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-B88DD2202076',"asd", 
        230947151931375617, '4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-000000000000',"dsa"
        ]));

}