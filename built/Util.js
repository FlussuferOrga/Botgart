"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const winston = __importStar(require("winston"));
const stringSimilarity = __importStar(require("string-similarity"));
const gw2 = require("gw2api-client");
const api = gw2();
api.schema('2019-03-26T00:00:00Z');
api.language('en');
function shallowInspect(o) {
    if (o instanceof Object) {
        Object.keys(o).forEach(k => console.log(k, o[k] ? o[k].constructor.name : typeof o));
    }
    else {
        console.log(o);
    }
}
exports.shallowInspect = shallowInspect;
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
function validateWorld(apikey) {
    let accepted = config.world_assignments;
    api.authenticate(apikey);
    // FIXME: invalid api key
    return api.account().get().then(acc => new Promise((resolve, reject) => {
        let match = config.world_assignments.filter(a => a.world_id === acc.world);
        if (match.length > 1) {
            // config broken
            return reject(exports.validateWorld.ERRORS.config_world_duplicate);
        }
        else if (match.length === 1) {
            // world admitted -> name of role the user should have
            return resolve(match[0].role);
        }
        else {
            // world not admitted -> false
            return resolve(false);
        }
    }), err => new Promise((resolve, reject) => reject(exports.validateWorld.ERRORS.network_error)));
}
exports.validateWorld = validateWorld;
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
function assignServerRole(member, currentRole, admittedRole) {
    // FIXME: the asynchronous erroring could leave the user in an undefined state, where the system
    // assumes him to now have role A, but in fact assigning him role A has failed!
    if (currentRole !== null && admittedRole !== null && currentRole.name === admittedRole.name) {
        // member already has proper role
        return admittedRole;
    }
    if (currentRole !== null) {
        // remove currentRole
        member.removeRole(currentRole).then(() => log("info", "Util.js", "Assigned role {0} to user {1}".formatUnicorn(currentRole.name, member.displayName)), (err) => log("error", "Util.js", "Error while giving role {0} to user {1}: {2}".formatUnicorn(currentRole.name, member.displayName, err.message)));
    }
    if (admittedRole !== null) {
        // assign admittedRole
        member.addRole(admittedRole).then(() => log("error", "Util.js", "Removed role {0} from user {1}".formatUnicorn(admittedRole.name, member.displayName)), (err) => log("error", "Util.js", "Error while removing role {0} from user {1}: {2}".formatUnicorn(admittedRole.name, member.displayName, err.message)));
    }
    return admittedRole;
}
exports.assignServerRole = assignServerRole;
;
/**
* Tries to resolve user input to a proper (localised) objective name.
*
* @param objectiveInput - whatever the user inputs as the objective name
* @param mapInput - whatever the user inputs as the map name. Optional, if nothing is put here, ambiguities on alpine borderlands may occur
* @returns a Promise resolving to either
*    [<resolved objective name>:string, <resolved map name>:string, <map id>:number, <objective id>:string] if we found a promising match
*    [<original user objective input>:string, <original user map input>: string, null, null] if no match could be found
*/
function resolveWvWObjective(objectiveInput, mapInput) {
    return api.language("de").wvw().objectives().all().then(res => {
        let objectives = res
            .filter(o => ["BlueHome", "RedHome", "GreenHome", "Center"].includes(o.map_type))
            .filter(o => ["Camp", "Tower", "Keep"].includes(o.type))
            .map((o => [o.name, o]))
            .reduce((acc, [k, v]) => { acc[k] = v; return acc; });
        let best = stringSimilarity.findBestMatch(objectiveInput, Object.keys(objectives)).bestMatch;
        return new Promise((resolve, reject) => {
            resolve((best.target === "0" && best.rating === 0)
                ? [objectiveInput, mapInput, null, null]
                : [best.target, mapInput, objectives[best.target].map_id, objectives[best.target].id]);
        });
    });
}
exports.resolveWvWObjective = resolveWvWObjective;
function getOwnedGuilds(apikey) {
    api.authenticate(apikey);
    return undefined; // FIXME
    //return api.getAccount().then(
    //   res => new Promise()
    //   res => new Promise((resolve, reject) => resolve(res.world === config.world_id)),
    //   res => new Promise((resolve, reject) => resolve(false))
    //);  
}
exports.getOwnedGuilds = getOwnedGuilds;
function getAccountGUID(apikey) {
    api.authenticate(apikey);
    return api.account().get().then(res => new Promise((resolve, reject) => resolve(res.id)), res => new Promise((resolve, reject) => resolve(false)));
}
exports.getAccountGUID = getAccountGUID;
function resolveDiscordUser(client, uid) {
    let user = null;
    let i = 0;
    let l = client.guilds.array().length; // discord.Collection actually provides a find(any -> boolean)-function, but I can't be arsed.
    while (!user && i < l) {
        user = client.guilds[i].members.find(m => m.user.id = uid);
    }
    return user;
}
exports.resolveDiscordUser = resolveDiscordUser;
function assertType(obj, t) {
    let p = obj;
    while (p && p.constructor.name !== t) {
        p = p.__proto__;
    }
    // if we walked the inheritence up and obj IS a t, then  we must have stopped before we hit NULL.
    // -> p being null implies that obj IS NOT a t.
    //assert(p != null, "Expected object to be of type {0}, but it is of type {1}.".formatUnicorn(t, obj ? obj.constructor.name : obj));
}
exports.assertType = assertType;
const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), winston.format.splat(), winston.format.simple(), winston.format.printf(({ level, label, message, timestamp }) => {
        return `${timestamp} ${level} [${label}]: ${message}`;
    })),
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
function log(level, label, message) {
    return logger.log({
        "label": label,
        "level": level,
        "message": message
    });
}
exports.log = log;
// taken from https://stackoverflow.com/a/18234317
String.prototype.formatUnicorn = function (...fnargs) {
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
