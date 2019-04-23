"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_akairo_1 = require("discord-akairo");
const L = __importStar(require("../Locale.js"));
class JoinListener extends discord_akairo_1.Listener {
    constructor() {
        super("guildMemberAdd", {
            emitter: "client",
            eventName: "guildMemberAdd"
        });
    }
    exec(member) {
        if (!member.user.bot) {
            member.send(L.get("WELCOME"));
        }
    }
}
exports.JoinListener = JoinListener;
module.exports = JoinListener;
