const config = require("../config.json");
import { BotgartClient } from  "./BotgartClient";
import { Patch } from "./patches/Patch.js";
import * as commandlineargs from "command-line-args";
import * as fs from "fs";

const client = new BotgartClient({
    ownerID: config.owner_ids,
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
  { name: "updateconfig", type: Boolean}
]);

// this is an in-order list of all patches
const allPatches = ["Patch1", "Patch2", "Patch3", "Patch4", "Patch5", "Patch6", "Patch7", "Patch8"];

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

function updateConfig(configFileName: string, defaultsFileName: string) {

    const fixBlock = (src,dst) => {
        Object.entries(src).forEach(t => {
            const k = t[0];
            const v = t[1];
            if(!dst.hasOwnProperty(k)) {
                dst[k] = v;  
            }
        });
    };
    const defaults = JSON.parse(fs.readFileSync(defaultsFileName, "utf-8")); // 
    const currentConfig = JSON.parse(fs.readFileSync(configFileName, "utf-8")); // 
    console.log(Object.assign(defaults, currentConfig));
}

if(args.updateconfig) {
    // disabled
    //updateConfig("config.json", "config.json.example");
} else if(args.patchall) {
    applyPatches(allPatches, args.revert === true)
} else if(args.patch) {
    applyPatches(args.patch, args.revert === true);
} else {
    startBot();
}

// node built/index.js --patchall
// node built/index.js --patch=PatchX 
// node built/index.js --patch=PatchX --revert