"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require("../config.json");
const BotgartClient_1 = require("./BotgartClient");
const commandlineargs = __importStar(require("command-line-args"));
const client = new BotgartClient_1.BotgartClient({
    ownerID: config.owner_id,
    prefix: config.prefix,
    commandDirectory: "./built/commands/",
    inhibitorDirectory: "./built/inhibitors/",
    listenerDirectory: "./built/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
}, "./db/database.db");
// bit weird but works only this way...
const args = commandlineargs.default([
    { name: "verbose", alias: "v", type: Boolean },
    { name: "patch", type: String, multiple: true },
    { name: "patchall", type: Boolean },
    { name: "revert", type: Boolean },
]);
// this is an in-order list of all patches
const allPatches = ["Patch1", "Patch2"];
function startBot() {
    console.log("Starting up...");
    client.login(config.token);
    console.log("Started up...");
}
function resolvePatch(patchname) {
    let patch = null;
    try {
        const patchModule = require("./patches/" + patchname + ".js");
        patch = new patchModule[patchname](client.db);
    }
    catch (e) {
        console.log(e.message);
    }
    return patch;
}
function applyPatch(patchname, revert = false) {
    let patch = resolvePatch(patchname);
    if (patch) {
        if (revert) {
            console.log("Reverting patch...");
            patch.revert();
            console.log("Patch reversion done.");
        }
        else {
            console.log("Applying patch...");
            patch.execute();
            console.log("Patch application done.");
        }
    }
}
if (args.patchall) {
    allPatches.forEach(p => applyPatch(p, args.revert === true));
}
else if (args.patch) {
    args.patch.forEach(p => applyPatch(p, args.revert === true));
}
else {
    startBot();
}
