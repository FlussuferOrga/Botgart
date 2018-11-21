const config = require("../config.json");
const winston = require("winston");
const assert = require("assert");
const { inspect } = require('util');
const gw2 = require("@cthos/gw2-api");
const api = new gw2.gw2();
api.setStorage(new gw2.memStore());

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

exports.validateWorld = function(apikey) {
    api.setAPIKey(apikey);
    return api.getAccount().then(
       res => new Promise((resolve, reject) => resolve(res.world === config.world_id)),
       res => new Promise((resolve, reject) => resolve(false))
    );  
}

exports.getAccountGUID = function(apikey) {
    api.setAPIKey(apikey);
    return api.getAccount().then(
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