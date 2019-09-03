"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const fs = __importStar(require("fs"));
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
    { name: "updateconfig", type: Boolean }
]);
// this is an in-order list of all patches
const allPatches = ["Patch1", "Patch2", "Patch3", "Patch4", "Patch5", "Patch6"];
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
    return __awaiter(this, void 0, void 0, function* () {
        let patch = resolvePatch(patchname);
        if (patch) {
            if (revert) {
                console.log("Reverting patch...");
                yield patch.revert();
                console.log("Patch reversion done.");
            }
            else {
                console.log("Applying patch...");
                yield patch.execute();
                console.log("Patch application done.");
            }
        }
    });
}
function applyPatches(patches, revert = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let ps = args.revert === true ? patches.reverse() : patches;
        for (let p of ps) {
            yield applyPatch(p, args.revert === true);
        }
    });
}
function updateConfig(configFileName, defaultsFileName) {
    const fixBlock = (src, dst) => {
        Object.entries(src).forEach(t => {
            const k = t[0];
            const v = t[1];
            if (!dst.hasOwnProperty(k)) {
                dst[k] = v;
            }
        });
    };
    const defaults = JSON.parse(fs.readFileSync(defaultsFileName, "utf-8")); // 
    const currentConfig = JSON.parse(fs.readFileSync(configFileName, "utf-8")); // 
    console.log(Object.assign(defaults, currentConfig));
}
if (args.updateconfig) {
    // disabled
    //updateConfig("config.json", "config.json.example");
}
else if (args.patchall) {
    applyPatches(allPatches, args.revert === true);
}
else if (args.patch) {
    applyPatches(args.patch, args.revert === true);
}
else {
    startBot();
}
