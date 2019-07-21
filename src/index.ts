let config = require("../config.json");
import { BotgartClient } from  "./BotgartClient";
import { Patch } from "./patches/Patch.js";
import * as commandlineargs from "command-line-args";

const client = new BotgartClient({
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
  { name: "patch", type: String, multiple: true},
  { name: "patchall", type: Boolean },
  { name: "revert", type: Boolean },
]);

// this is an in-order list of all patches
const allPatches = ["Patch1", "Patch2", "Patch3"]

function startBot() {
    console.log("Starting up...");
    client.login(config.token);
    console.log("Started up...");
}

function resolvePatch(patchname: string): Patch|null {
    let patch = null;
    try {
        const patchModule = require("./patches/" + patchname + ".js");
        patch = new patchModule[patchname](client.db);
    } catch(e) {
        console.log(e.message);
    }
    return patch; 
}

async function applyPatch(patchname: string, revert:boolean = false) {
    let patch = resolvePatch(patchname);
    if(patch) {
        if(revert) {
            console.log("Reverting patch...");
            await patch.revert();
            console.log("Patch reversion done.")
        } else {
            console.log("Applying patch...");
            await patch.execute();
            console.log("Patch application done.")
        }      
    }
}

async function applyPatches(patches: string[], revert: boolean = false) {
    let ps = args.revert === true ? patches.reverse() : patches;
    for (let p of ps) {
        await applyPatch(p, args.revert === true);
    }    
}

if(args.patchall) {
    applyPatches(allPatches, args.revert === true)
}else if(args.patch) {
    applyPatches(args.patch, args.revert === true);
} else {
    startBot();    
}
