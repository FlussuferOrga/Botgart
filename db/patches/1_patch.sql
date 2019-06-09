PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
-- adding a column with NOT NULL constraint to an existing
-- table in SQLite requires creating a temporary table of the new format
-- and moving all the data over: https://www.sqlite.org/lang_altertable.html
CREATE TABLE IF NOT EXISTS new_registrations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    guild TEXT NOT NULL,
    api_key TEXT NOT NULL,
    gw2account TEXT NOT NULL,
    registration_role TEXT,
    created TIMESTAMP DEFAULT (datetime('now','localtime')),
    UNIQUE(user, guild) ON CONFLICT REPLACE,
    UNIQUE(guild, api_key)
);
-- move the data over
INSERT INTO new_registrations(id, user, guild, api_key, gw2account, registration_role, created)
SELECT 
    r.id, r.user, r.guild, r.api_key, r.gw2account, 'Flussufer', r.created 
FROM registrations AS r 
;
-- delete old table and rename new one
DROP TABLE registrations;
ALTER TABLE new_registrations RENAME TO registrations;
PRAGMA foreign_key_check;
COMMIT;
PRAGMA foreign_keys = ON;