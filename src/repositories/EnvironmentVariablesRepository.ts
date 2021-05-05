import * as discord from "discord.js";
import { AbstractDbRepository } from "./AbstractDbRepository";

export class EnvironmentVariablesRepository extends AbstractDbRepository {

    /**
     * Convenience method for _getEnvironmentVariable.
     */
    public getEnvironmentVariable(guild: discord.Guild, name: string): [string, string, (boolean | number | string | null)] {
        return this._getEnvironmentVariable(guild.id, name);
    }

    /**
     * Gets the value of an environment variable as set for a guild.
     * guildId: ID of the guild to lookup the variable in.
     * name: name of the variable.
     * returns: triple [0]: value as text,
     *                 [1]: type of the value, as stored in the DB
     *                 [2]: casted version, if the type was among the supported types, else undefined
     */
    public _getEnvironmentVariable(guildId: string, name: string): [string, string, (boolean | number | string | null)] {
        return this.execute(db => {
                const res = db.prepare(`SELECT value, type FROM environment_variables WHERE guild = ? AND name = ?`)
                    .get(guildId, name);
                let casted: string | number | boolean | null = null;
                switch (res.type) {
                    case "boolean":
                        casted = (res.value === "true");
                        break;
                    case "number":
                        casted = Number(res.value);
                        break;
                    case "string":
                        casted = res.value;
                        break;
                }
                return ["" + res.value, "" + res.type, casted];
            })
            ?? ["null", "null", null];
    }

    /**
     * Convenience method for _setEnvironmentVariable.
     */
    public setEnvironmentVariable(guild: discord.Guild, name: string, value: (boolean | number | string), type: string | null = null) {
        return this._setEnvironmentVariable(guild.id, name, value, type);
    }

    /**
     * Sets an environment variable for a guild. A variable is identified by its name.
     * No scoping beyond the guild is possible and setting an already existing EV in a guild
     * leads to the old value (and type!) being overridden.
     * guildId: ID of the guild to store the EV in.
     * name: name of the EV.
     * type: type of the variable as it should be stored. This will affect how it will be retrieved later on in getEnvironmentVariable.
     */
    public _setEnvironmentVariable(guildId: string, name: string, value: (boolean | number | string), type: string | null = null) {
        const typeName = type || typeof value;
        return this.execute(db => db.prepare(`
            INSERT INTO 
                    environment_variables(guild, name, type, value) 
                    VALUES(?,?,?,?)
                  ON CONFLICT(guild, name) DO UPDATE SET 
                    guild = ?,
                    name = ?,
                    type = ?,
                    value = ?
        `).run(guildId, name, "" + typeName, "" + value, guildId, name, "" + typeName, "" + value));
    }
}