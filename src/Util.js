const config = require("../config.json");
const winston = require("winston");
const assert = require("assert");
const { inspect } = require('util');
const gw2 = require("gw2api-client");
//const api = new gw2.gw2();
const api = gw2();
//api.setStorage(new gw2.memStore());
api.schema('2019-03-26T00:00:00Z')
api.language('en');

exports.inspect = (x) => {
    console.log(inspect(x));
}

exports.shallowInspect = function(o) {
    if(o instanceof Object) {
        Object.keys(o).forEach(k => console.log(k, o[k] ? o[k].constructor.name : typeof o));
    } else {
        console.log(o);
    }
}

/**
* Tries to validate the passed API key.
* apikey: valid apikey. No format checking will be done at this point.
* returns: either
*           (1) the name of the role the user should be assigned, according to the config (string)
*           (2) false if the world the user plays on is not qualified to get any role
*           (3) undefined in case of an error, eg network error
*/
exports.ERRORS = {
    "config_world_duplicate": 1,
    "network_error": 2
};
exports.validateWorld = function(apikey) {
    let accepted = config.world_assignments;
    api.authenticate(apikey);
    // FIXME: invalid api key
    return api.account().get().then(
        acc => new Promise((resolve, reject) => {
            let match = config.world_assignments.filter(a => a.world_id === acc.world);
            if(match.length > 1) {
                return reject(exports.ERRORS.config_world_duplicate);
                // FIXME: error, config broken
            } else if(match.length === 1) {
                // world allowed -> name of role
                return resolve(match[0].role);
            } else {
                // world not allowed -> false
                return resolve(false);
            }
        }),
        err => new Promise((resolve, reject) => reject(exports.ERRORS.network_error))
    );
    // FIXME: return role if any, or undefined
    //api.setAPIKey(apikey);
    //return api.getAccount().then(
    //   res => new Promise((resolve, reject) => resolve(res.world === config.world_id)),
    //   res => new Promise((resolve, reject) => resolve(false))
    //);  
}

exports.getOwnedGuilds = function(apikey) {
    api.authenticate(apikey);
    return undefined; // FIXME
    //return api.getAccount().then(
    //   res => new Promise()
    //   res => new Promise((resolve, reject) => resolve(res.world === config.world_id)),
    //   res => new Promise((resolve, reject) => resolve(false))
    //);  
}

exports.getAccountGUID = function(apikey) {
    api.authenticate(apikey);
    return api.account().get().then(
        res => new Promise((resolve, reject) => resolve(res.id)),
        res => new Promise((resolve, reject) => resolve(false))
    );
}

exports.resolveDiscordUser = function(client, uid) {
    let user = null;
    let i = 0;
    while(!user && i < client.guilds.length) {
        user = client.guilds[i].members.find(m => m.user.id = uid);
    }
    return user;
}

exports.assertType = function(obj, t) {
    let p = obj;
    while(p && p.constructor.name !== t) {
        p = p.__proto__;
    }
    // if we walked the inheritence up and obj IS a t, then  we must have stopped before we hit NULL.
    // -> p being null implies that obj IS NOT a t.
    assert(p != null, "Expected object to be of type {0}, but it is of type {1}.".formatUnicorn(t, obj ? obj.constructor.name : obj));
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
      filename: 'bot_combined.log',
      level: 'info'
    }),
    new winston.transports.File({
      filename: 'bot_errors.log',
      level: 'error'
    })
  ]
});
exports.log = function(level, label, message) {
    return logger.log({
        "label": label,
        "level": level,
        "message": message
    });
}

// taken from https://stackoverflow.com/a/18234317
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];
        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }
    return str;
};
