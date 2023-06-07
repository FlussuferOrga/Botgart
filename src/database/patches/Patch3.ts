import { Semaphore } from "await-semaphore";
import { getAccountInfo } from "../../Gw2ApiUtils";
import { logger } from "../../util/Logging";
import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

const LOG = logger();

/**
 * Adds the account-name column to the registrations table and populates it.
 */
export class Patch3 extends DBPatch {
    private oldCount: number;

    constructor(db: Database) {
        super(db);
    }

    protected async satisfied(): Promise<boolean> {
        return this.columnExists("registrations", "account_name");
    }

    private async resolveAccountNames(rows) {
        const semaphore = new Semaphore(10);
        for await (const r of rows) {
            const release = await semaphore.acquire();
            const account = await getAccountInfo(r.api_key);
            let accname = account?.name;
            if (accname !== undefined) {
                accname = "INVALID API KEY"; // doesn't matter, will be deleted in next reauth anyway.
            }
            release();
            LOG.debug("resolved " + accname);
            this.connection
                .prepare(
                    `INSERT INTO new_registrations(id, user, guild, api_key, gw2account,
                                                                   registration_role, account_name, created)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .run(r.id, r.user, r.guild, r.api_key, r.gw2account, r.registration_role, accname, r.created);
        }
    }

    protected async apply(): Promise<void> {
        const con = this.connection;
        this.oldCount = (
            this.connection
                .prepare(
                    `SELECT COUNT(*) AS c
                                                  FROM registrations`
                )
                .get() as { c: number }
        ).c;
        this.dbbegin();
        con.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        con.prepare(
            `
            CREATE TABLE IF NOT EXISTS new_registrations
            (
                id
                    INTEGER
                    PRIMARY
                        KEY
                    AUTOINCREMENT,
                user
                    TEXT
                    NOT
                        NULL,
                guild
                    TEXT
                    NOT
                        NULL,
                api_key
                    TEXT
                    NOT
                        NULL,
                gw2account
                    TEXT
                    NOT
                        NULL,
                registration_role
                    TEXT
                    NOT
                        NULL,
                account_name
                    TEXT,
                created
                    TIMESTAMP
                    DEFAULT (
                        datetime(
                                'now',
                                'localtime'
                            )),
                UNIQUE (
                        user,
                        guild
                    ) ON CONFLICT REPLACE,
                UNIQUE (
                        guild,
                        api_key
                    )
            )`
        ).run();

        await this.resolveAccountNames(
            con
                .prepare(
                    `SELECT *
                                                    FROM registrations`
                )
                .all()
        );
        // delete old table and rename new one
        con.prepare("DROP TABLE registrations").run();
        con.prepare(
            `ALTER TABLE new_registrations
            RENAME TO registrations`
        ).run();
        con.pragma("foreign_keys = ON");
    }

    public async checkPostconditions(): Promise<boolean> {
        const newCount = (
            this.connection
                .prepare(
                    `SELECT COUNT(*) AS c
                                                  FROM registrations`
                )
                .get() as { c: number }
        ).c;
        const post = this.oldCount === newCount;
        if (!post) {
            LOG.error(
                "Expected equal number of entries for old and new table. But old table had {0} entries " +
                    "while new has {1}. Reverting.".formatUnicorn(this.oldCount, newCount)
            );
        }
        return post;
    }

    public async revert(): Promise<void> {
        const con = this.connection;
        this.dbbegin();
        con.pragma("foreign_keys = OFF");
        // adding a column with NOT NULL constraint to an existing
        // table in SQLite requires creating a temporary table of the new format
        // and moving all the data over: https://www.sqlite.org/lang_altertable.html
        con.prepare(
            `
            CREATE TABLE IF NOT EXISTS new_registrations
            (
                id
                    INTEGER
                    PRIMARY
                        KEY
                    AUTOINCREMENT,
                user
                    TEXT
                    NOT
                        NULL,
                guild
                    TEXT
                    NOT
                        NULL,
                api_key
                    TEXT
                    NOT
                        NULL,
                gw2account
                    TEXT
                    NOT
                        NULL,
                registration_role
                    TEXT
                    NOT
                        NULL,
                created
                    TIMESTAMP
                    DEFAULT (
                        datetime(
                                'now',
                                'localtime'
                            )),
                UNIQUE (
                        user,
                        guild
                    ) ON CONFLICT REPLACE,
                UNIQUE (
                        guild,
                        api_key
                    )
            )`
        ).run();
        this.connection
            .prepare(
                `
            INSERT INTO new_registrations(id, user, guild, api_key, gw2account, registration_role, created)
            SELECT r.id, r.user, r.guild, r.api_key, r.gw2account, r.registration_role, r.created
            FROM registrations AS r
        `
            )
            .run();

        // delete old table and rename new one
        con.prepare("DROP TABLE registrations").run();
        con.prepare(
            `ALTER TABLE new_registrations
            RENAME TO registrations`
        ).run();
        con.pragma("foreign_keys = ON");
        this.dbcommit();
    }
}
