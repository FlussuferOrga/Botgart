BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS permanent_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild TEXT NOT NULL,
    user TEXT NOT NULL,
    role TEXT NOT NULL,
    created TIMESTAMP DEFAULT (datetime('now','localtime')),
    UNIQUE(guild, user, role)
);
COMMIT;