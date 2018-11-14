const Util = require("./Util.js");
const sqlite3 = require("sqlite3").verbose();

function initSchema() {
    let sql = `
        CREATE TABLE registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_key TEXT,
            user INT,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    execute((db) => {
        db.run(sql);
    });
}

function execute(f) {
    let db = new sqlite3.Database("./db/database.db", sqlite3.OPEN_CREATE, (err) => {
        if(err) {
            return console.error(err.message);
        }
    });
    let res = f(db);

    db.close((err) => {
        return console.error(err.message);
    });
    return res;
}

exports.storeAPIKey = function(key, user) {
    let sql = `INSERT INTO registrations(api_key, user) VALUES(?,?)`;
    execute((db) => {
        db.run(sql, [key, user]);
    });
}

exports.revalidateKeys = function() {
    let sql = `SELECT api_key, user FROM registrations`;
    execute((db) => {
        let prune = [];
        db.each(sql, [], (err, row) => {
            if(!exports.validateWorld(row.api_key)) {
                prune.push(row.user);
            }
        });
        return prune;
    });
}