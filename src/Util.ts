const config = require("../config.json");
import * as discord from "discord.js";
import * as winston from "winston";
//import * as gw2 from "gw2api-client";
import * as assert from "assert";
import { inspect } from "util";
import * as stringSimilarity from "string-similarity";

const gw2 = require("gw2api-client");
const api = gw2();

api.schema('2019-03-26T00:00:00Z');
api.language('en');

// retry some times and be polite about it
api.fetch.retry(tries => tries <= 5)
api.fetch.retryWait(tries => tries * 3000)

export const RESET_WEEKDAY = 5; // FRIDAY

/**
* Compares two dates without considering the time component
* and normalised to UTC, to avoid summer-winter-conflicts. 
* -> 2019-12-24 13:00 === 2019-12-24 6:23
* d1: first date
* d2: second date
* returns: true if both dates are equal in day, month, and year
*/
export function compareDatesWithoutTime(d1: Date, d2: Date) {
    return d1.getUTCDate() == d2.getUTCDate()
           && d1.getUTCMonth() == d2.getUTCMonth()
           && d1.getUTCFullYear() == d2.getUTCFullYear()
}

/**
* Creates a standard UTC day without the time components.
* This can be relevant when adding to a day during computations
* can lead to confusing results when it's the middle of the day.
* -> 2019-12-24 13:00 -> 2019-12-24 00:00 
* d: the Date to normalise
* returns: the passed day with the time components set to 0
*/
export function getStandardDay(d: Date) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
* Determines the reset day for a certain week.
* week: the week to calculate the reset day for 
* year: the year the week lied in. Per default it is the current year, but take care around New Year!
* resetWeekDay: day of week the reset takes place: SUN 0, MON 1, TUE 2, WED 3, THU 4, FRI 5, SAT 6; per default it is Friday
* returns: the Date on which the reset of the specified week takes place.
*/
export function getResetDay(week : number, year : number = new Date().getFullYear(), resetWeekDay : number = 5) : Date {
  // look for the first reset day of the year
  let resetDay : Date = new Date(Date.UTC(year, 0, 1));
  while(resetDay.getDay() != resetWeekDay) {
    resetDay.setDate(resetDay.getDate() + 1);
  }
  const firstResetWeekNumber : number = getNumberOfWeek(resetDay); // if the first day of the year is either SAT or SUN, the first Friday of the year is in week 2! So check that.
  resetDay.setDate(resetDay.getDate() + (7 * (week - firstResetWeekNumber)));
  return resetDay;
}

// blatantly stolen from https://gist.github.com/IamSilviu/5899269#gistcomment-2918013
export function getNumberOfWeek(today: Date = new Date()) {
    today = getStandardDay(today);
    if(today.getDay() === 0) {
        // since JS weeks start on Sundays, we calculate the week for Saturday
        // if we would calculate the week for a Sunday.
        today.setDate(today.getDate() - 1);
    }
    const firstDayOfYear = new Date(Date.UTC(today.getFullYear(), 0, 1));
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function formatUserPing(uid: string) {
    return "<@{0}>".formatUnicorn(uid);
}

export async function asyncForEach(array, callback) {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
}

export function setMinus<T>(s1: Iterable<T>, s2: Set<T>) {
    return new Set(Array.from(s1).filter(x => !s2.has(x)));
}

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
*                   (c) the key is structurally valid, but not known to the API (invalid key)
*/
export function validateWorld(apikey: string): Promise<string|boolean|number> {
    let accepted = config.world_assignments;
    api.authenticate(apikey);
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
        err => new Promise((resolve, reject) => {
            log("error", "Util.js", "Encountered an error while trying to validate a key. This is most likely an expected error: {0}".formatUnicorn(JSON.stringify(err)));
            if(err.content.text === "invalid key") {
                return reject(exports.validateWorld.ERRORS.invalid_key);
            } else {
                return reject(exports.validateWorld.ERRORS.network_error);
            }
        })
    );
}
validateWorld.ERRORS = {
    "config_world_duplicate": 1,
    "network_error": 2,
    "invalid_key": 3
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
            ()    => log("info", "Util.js", "Removed role {0} from user {1}".formatUnicorn(currentRole.name, member.displayName)),
            (err) => log("error", "Util.js", "Error while removing role {0} from user {1}: {2}".formatUnicorn(currentRole.name, member.displayName, err.message))
        );
    }

    if(admittedRole !== null) {
        // assign admittedRole
        member.addRole(admittedRole).then(
            ()    => log("info", "Util.js", "Gave role {0} to user {1}".formatUnicorn(admittedRole.name, member.displayName)),
            (err) => log("error", "Util.js", "Error while giving role {0} to user {1}: {2}".formatUnicorn(admittedRole.name, member.displayName, err.message))
        );
    }
    return admittedRole;
};

/**
* Tries to resolve user input to a proper (localised) objective name.
*
* @param objectiveInput - whatever the user inputs as the objective name
* @param mapInput - whatever the user inputs as the map name. Optional, if nothing is put here, ambiguities on alpine borderlands may occur 
* @returns a Promise resolving to either 
*    [<resolved objective name>:string, <resolved map name>:string, <map id>:number, <objective id>:string] if we found a promising match
*    [<original user objective input>:string, <original user map input>: string, null, null] if no match could be found
*/
export function resolveWvWObjective(objectiveInput: string, mapInput?: string): Promise<[string,string,number,string]|[string,string,null,null]> {
    return api.language("de").wvw().objectives().all().then(
        res => resolveWvWMap(mapInput)
            .then(([resolved, wvwMap]) => {
                let mapFilter = resolved ? [wvwMap] : ["BlueHome", "RedHome", "GreenHome", "Center"];
                let objectives = res
                                 .filter(o => o.map_id != 94) // filter out the obsolete red alpine borderland
                                 .filter(o => mapFilter.includes(o.map_type))
                                 .filter(o => ["Camp", "Tower", "Keep"].includes(o.type))
                                 .map(o => [o.name, o])
                                 .reduce((acc, [k,v]) => { acc[k] = v; return acc; }, {});
                let best = stringSimilarity.findBestMatch(objectiveInput, Object.keys(objectives)).bestMatch;
                return new Promise((resolve, reject) => {
                    resolve(best.rating === 0
                        ? [objectiveInput, wvwMap, null, null]
                        : [best.target, wvwMap, objectives[best.target].map_id, objectives[best.target].id])
                });
            })
        );
}

let mapAliasesPairs : [string, string[]][] = [
    ["Center",   ["ebg", "ewige", "es"]],
    ["BlueHome", ["blaue", "blue", "bgl", "bbl"]],
    ["GreenHome",["grüne", "green", "ggl", "gbl"]],
    ["RedHome",  ["rote", "red", "rgl", "rbl", "wüste", "dessert"]],
    ["homes",    ["home", "homes", "heimat"]]
];
let mapAliases = mapAliasesPairs
    .reduce((acc, [k,vs]) => { vs.map(v => acc[v] = k); return acc; }, {});

/**
* Tries to resolve the given user input to a standard world name. 
*
* @param userInput - what the user typed as string for the map name
* @returns a Promise resolving to a pair to either 
*        [true, the resolved name] (special case, strings akin to "home" are resolved to the current home map, as specified in the config)
*      , [false, the original user input]
*/
export function resolveWvWMap(userInput: string): Promise<[boolean, string]> {
    let res: Promise<[boolean, string]> = new Promise((resolve, reject) => resolve([false, null]));
    if(userInput !== null && userInput !== undefined) {
        let best = stringSimilarity.findBestMatch(userInput, Object.keys(mapAliases)).bestMatch;
        if(best.rating === 0) {
            // could not resolve to anything
            res = new Promise((resolve, reject) => resolve([false, userInput]));
        } else {
            let m = mapAliases[best.target];
            if(m === "homes") {
                // resolve home colour
                res = resolveMatchColour(config.home_id).then(
                    home => new Promise((resolve, reject) => resolve([true, mapAliases[home]]))
                );
            } else {
                // resolved properly
                res = new Promise((resolve, reject) => resolve([true, m]));
            }
        }
    }
    return res;
}

/**
* Finds the colour of a world specified by its ID in its current matchup.
*
* @param worldId - the ID of the world to find the colour for
* @returns Promise "red", "blue" or "green" if it could be resolved or Promise<null> if the ID could not be resolved.
*/
export function resolveMatchColour(worldId: number): Promise<"red"|"blue"|"green"|null> {
    return api.wvw().matches().overview().world(worldId).then(
        matchUp => {
            let home = Object.keys(matchUp.all_worlds)
                .map(k => matchUp.all_worlds[k].includes(worldId) ? k : null)
                .filter(x => x !== null)
            if(home.length !== 1) {
                log("error", "Util.js", "Expected to find world with ID = {0} in exactly one team. But found it in {1} teams.".formatUnicorn(worldId, home.length));    
            }
            return home[0];
        },
        err => {
            log("error", "Util.js", "Error '{0}' when trying to resolve colour for world with ID = {1}".formatUnicorn(err.content.text, worldId));
            return null;
        }
    );
}

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

export function getAccountName(apikey: string): Promise<string|boolean> {
    api.authenticate(apikey);
    return api.account().get().then(
        res => new Promise((resolve, reject) => resolve(res.name)),
        res => new Promise((resolve, reject) => resolve(false))
    );
}

export function resolveDiscordUser(client: discord.Client, uid: string): discord.GuildMember|null {
    let user: discord.GuildMember = null;
    let i = 0;
    const gs = client.guilds.array();
    let l = gs.length; // discord.Collection actually provides a find(any -> boolean)-function, but I can't be arsed.
    
    while(!user && i < l) {
        user = gs[i].members.find(m => m.user.id === uid);
        i++;
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
  levels: winston.config.syslog.levels,
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
    }),
    new winston.transports.File({
        filename: '/tmp/botgart_debug.log',
        level: 'debug'
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
