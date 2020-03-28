const config = require("../config.json");
import { log } from "../Util";
import { Database } from "../DB.js";
import { DBPatch } from "./DBPatch.js";

/**
* Automatic link server detection
*/
export class Patch10 extends DBPatch {
    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> { 
        return this.tableExists("server_links")
            && this.tableExists("linked_servers")
            && this.tableExists("registration_roles")
    }

    protected async apply(): Promise<void> {
        this.dbbegin();

        this.connection.prepare(`
          CREATE TABLE server_links(
              link_id INTEGER PRIMARY KEY,
              timestamp TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
          )
          `).run();

        this.connection.prepare(`
            CREATE TABLE linked_servers(
                linked_server_id INTEGER PRIMARY KEY, 
                link_id INTEGER,
                server_id INTEGER,
                is_main INTEGER,
                FOREIGN KEY(link_id) REFERENCES server_links(link_id)
                ON DELETE CASCADE,
                CHECK is_main IN (0,1)
            )
            `).run();

        this.connection.prepare(`
            CREATE TABLE registration_roles(
                registration_roles_id INTEGER PRIMARY KEY, 
                registration_id INTEGER,
                role TEXT NOT NULL
            )
            `).run();

        this.connection.prepare(`
            INSERT INTO registration_roles(registration_id, role)
            SELECT registration_id, registration_role FROM registrations
            `).run();


        this.connection.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        this.connection.prepare(`
            CREATE TABLE IF NOT EXISTS new_registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            api_key TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            account_name TEXT,
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(user, guild) ON CONFLICT REPLACE,
            UNIQUE(guild, api_key)
        )`).run();

        this.connection.prepare(`
            INSERT INTO new_registrations(id, user, guild, api_key, gw2account, account_name, created)
            SELECT id, user, guild, api_key, gw2account, account_name, created FROM registrations
        `).run();

        this.connection.prepare(`DROP TABLE registrations`).run();
        this.connection.prepare(`ALTER TABLE new_registrations RENAME TO registrations`).run();
        this.connection.pragma("foreign_keys = ON");
    }

    public async revert(): Promise<void> {
        this.dbbegin();
        this.connection.pragma("foreign_keys = OFF");
        this.connection.prepare(`
            CREATE TABLE IF NOT EXISTS new_registrations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            api_key TEXT NOT NULL,
            gw2account TEXT NOT NULL,
            account_name TEXT,
            registration_role TEXT;
            created TIMESTAMP DEFAULT (datetime('now','localtime')),
            UNIQUE(user, guild) ON CONFLICT REPLACE,
            UNIQUE(guild, api_key)
        )`).run();

        this.connection.prepare(`
            INSERT INTO new_registrations(id, user, guild, api_key, gw2account, account_name, registration_role, created) 
            SELECT 
                r.id,
                r.user,
                r.guild,
                r.api_key,
                r.gw2account,
                r.account_name,
                rr.role, 
                r.created
            FROM 
                registrations AS r 
                JOIN registration_roles AS rr 
                  ON r.id = rr.registration_id 
            WHERE 
                rr.role <> '?'
        `).run(config.linked_role); // players might have two roles at this point: their server role and the link-role. The latter must be removed to match the former table schema.
        this.connection.prepare(`DROP TABLE registrations`).run();
        this.connection.prepare(`ALTER TABLE new_registrations RENAME TO registrations`).run();
        this.connection.pragma("foreign_keys = ON");
        this.connection.prepare(`DROP TABLE IF EXISTS linked_servers`).run();
        this.connection.prepare(`DROP TABLE IF EXISTS server_links`).run();
        this.dbcommit()
    }
}
