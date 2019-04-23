let config = require("../../config.json");
import * as discord from "discord.js";
import * as winston from "winston";
import * as gw2 from "gw2api-client";
import * as assert from "assert";
import { inspect } from "util";
const api : gw2 = gw2();

api.schema('2019-03-26T00:00:00Z');
api.language('en');

export function shallowInspect(o: any): void {
    if(o instanceof Object) {
        Object.keys(o).forEach(k => console.log(k, o[k] ? o[k].constructor.name : typeof o));
    } else {
        console.log(o);
    }
}

/**
* Tries to validate the passed API key.
* @param {string} apikey - valid apikey. No format checking will be done at this point.
* @returns {string|bool|int} - either
*           (1) resolves to the name of the role the user should be assigned, according to the config (string)
*           (2) resolves to false if the world the user plays on is not qualified to get any role
*           (3) rejects to an error from validateWorld.ERRORS if 
*                   (a) the world is faulty within the config
*                   (b) a network error occured
*/
export function validateWorld(apikey: string): Promise<string|boolean|number> {
    let accepted = config.world_assignments;
    api.authenticate(apikey);
    // FIXME: invalid api key
    return api.account().get().then(
        acc => new Promise((resolve, reject) => {
            let match = config.world_assignments.filter(a => a.world_id === acc.world);
            if(match.length > 1) {
                // config broken
                return reject(exports.validateWorld.ERRORS.config_world_duplicate);
            } else if(match.length === 1) {
                // world admitted -> name of role the user should have
                return resolve(match[0].role);
            } else {
                // world not admitted -> false
                return resolve(false);
            }
        }),
        err => new Promise((resolve, reject) => reject(exports.validateWorld.ERRORS.network_error))
    );
}
validateWorld.ERRORS = {
    "config_world_duplicate": 1,
    "network_error": 2
};

/**
* Assigns a role to user if needed. This method can be used for either assigning
* roles to new users or assigning them new, mutual exclusive ones:
* assignServerRole(u, A, null): u currently has role A, but should have no role (left server)
* assignServerRole(u, null, A): u currently has no role, but should have role A (new user)
* assignServerRole(u, A, B): u currently has role A, but should have role B (changed server to another admitted server)
* assignServerRole(u, A, A): u already has the role they should have. This is just proper revalidation and will do nothing.
*
* @param {GuildMember} member - the member to assign a server role to.
* @param {Role|null} currentRole - the role the member was assigned last.
* @param {Role|null} admittedRole - the role the member should actually have.
* @returns {Role|null} - the role the member is now assigned.
*/
export function assignServerRole(member: discord.GuildMember, currentRole: discord.Role | null, admittedRole: discord.Role | null) : discord.Role | null {
    // FIXME: the asynchronous erroring could leave the user in an undefined state, where the system
    // assumes him to now have role A, but in fact assigning him role A has failed!

    if(currentRole !== null && admittedRole !== null && currentRole.name === admittedRole.name) {
        // member already has proper role
        return admittedRole;
    }

    if(currentRole !== null) {
        // remove currentRole
        member.removeRole(currentRole).then(
            ()    => log("info", "Util.js", "Assigned role {0} to user {1}".formatUnicorn(currentRole.name, member.displayName)),
            (err) => log("error", "Util.js", "Error while giving role {0} to user {1}: {2}".formatUnicorn(currentRole.name, member.displayName, err.message))
        );
    }

    if(admittedRole !== null) {
        // assign admittedRole
        member.addRole(admittedRole).then(
            ()    => log("error", "Util.js", "Removed role {0} from user {1}".formatUnicorn(admittedRole.name, member.displayName)),
            (err) => log("error", "Util.js", "Error while removing role {0} from user {1}: {2}".formatUnicorn(admittedRole.name, member.displayName, err.message))
        );
    }
    return admittedRole;
};

export function getOwnedGuilds(apikey: string): any {
    api.authenticate(apikey);
    return undefined; // FIXME
    //return api.getAccount().then(
    //   res => new Promise()
    //   res => new Promise((resolve, reject) => resolve(res.world === config.world_id)),
    //   res => new Promise((resolve, reject) => resolve(false))
    //);  
}

export function getAccountGUID(apikey: string): Promise<number|boolean> {
    api.authenticate(apikey);
    return api.account().get().then(
        res => new Promise((resolve, reject) => resolve(res.id)),
        res => new Promise((resolve, reject) => resolve(false))
    );
}

export function resolveDiscordUser(client: discord.Client, uid: string) {
    let user = null;
    let i = 0;
    let l = client.guilds.array().length; // discord.Collection actually provides a find(any -> boolean)-function, but I can't be arsed.
    while(!user && i < l) {
        user = client.guilds[i].members.find(m => m.user.id = uid);
    }
    return user;
}

export function assertType(obj:any, t:string): void {
    let p = obj;
    while(p && p.constructor.name !== t) {
        p = p.__proto__;
    }
    // if we walked the inheritence up and obj IS a t, then  we must have stopped before we hit NULL.
    // -> p being null implies that obj IS NOT a t.
    //assert(p != null, "Expected object to be of type {0}, but it is of type {1}.".formatUnicorn(t, obj ? obj.constructor.name : obj));
}

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.simple(),
    winston.format.printf(({ level, label, message, timestamp }) => {
        return `${timestamp} ${level} [${label}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'log/bot_combined.log',
      level: 'info'
    }),
    new winston.transports.File({
      filename: 'log/bot_errors.log',
      level: 'error'
    })
  ]
});
export function log(level: string, label: string, message: string): winston.Logger {
    return logger.log({
        "label": label,
        "level": level,
        "message": message
    });
}

declare global {
    interface String {
        formatUnicorn(...fnargs: any[]) : string;
    }
}

// taken from https://stackoverflow.com/a/18234317
String.prototype.formatUnicorn = function (...fnargs: any[]): string {
    "use strict";
    var str = this.toString();
    if (fnargs.length) {
        var t = typeof fnargs[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(fnargs)
            : fnargs[0];
        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }
    return str;
};
