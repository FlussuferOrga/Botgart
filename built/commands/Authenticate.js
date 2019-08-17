"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
let config = require.main.require("../config.json");
const Util = __importStar(require("../Util"));
const L = __importStar(require("../Locale"));
const BotgartCommand_1 = require("../BotgartCommand");
/**
Testcases:
- missing parameters -> error
- valid key -> authenticated
- valid duplicate key for the same user -> key replaced
- valid duplicate key for another user -> error
- invalid key with valid format -> error
- all of the above through DM and channel -> _
- all of the above with missing authenticate role -> error
- cron: anything -> error
*/
class AuthenticateCommand extends BotgartCommand_1.BotgartCommand {
    constructor() {
        super("authenticate", {
            aliases: ["register", "authenticate", "auth"],
            args: [
                {
                    id: "key",
                    type: "string",
                    default: ""
                },
            ]
        }, true, // available per DM
        false, // cronable
        10 // everyone permission
        );
    }
    desc() {
        return L.get("DESC_AUTHENTICATE");
    }
    command(message, responsible, guild, args) {
        if (!message) {
            Util.log("error", "Authenticate.js", "Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }
        let members = []; // plural, as this command takes place on all servers this bot shares with the user
        let reply = "";
        // this snippet allows users to authenticate themselves
        // through a DM and is dedicated to Jey, who is a fucking 
        // numbnut when it comes to data privacy and posting your
        // API key in public channels.
        this.client.guilds.forEach(function (g) {
            let m = g.members.find(m => m.id == message.author.id);
            if (m) {
                members.push({ "guild": g, "member": m });
            }
        });
        message.util.send(L.get("CHECKING_KEY"));
        // 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111
        let validFormat = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{20}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(args.key);
        if (!validFormat) {
            message.util.send(L.get("KEY_INVALID_FORMAT"));
            return;
        }
        else {
            // try to delete the message for privacy reasons if it is not a direct message
            if (message && message.member) {
                if (message.deletable) {
                    message.delete();
                }
                else {
                    message.util.send(L.get("NO_DEL_PERM"));
                }
            }
            let cl = this.client;
            Util.validateWorld(args.key).then(role => {
                if (role === false) {
                    Util.log("info", "Authenticate.js", "Declined API key {0}.".formatUnicorn(args.key));
                    reply = L.get("KEY_DECLINED");
                    responsible.send(reply);
                }
                else {
                    Util.getAccountGUID(args.key).then((guid) => __awaiter(this, void 0, void 0, function* () {
                        yield Util.asyncForEach(members, (m) => __awaiter(this, void 0, void 0, function* () {
                            let r = m.guild.roles.find(r => r.name === role);
                            if (!r) {
                                Util.log("error", "Authenticate.js", "Role '{0}' not found on server '{1}'. Skipping.".formatUnicorn(role, m.guild.name));
                                reply = L.get("INTERNAL_ERROR");
                            }
                            else {
                                let accountName = yield Util.getAccountName(args.key);
                                let i = 3;
                                while (accountName === false && i > 0) {
                                    accountName = yield Util.getAccountName(args.key);
                                    i--;
                                }
                                if (accountName === false) {
                                    Util.log("warning", "Authenticate.js", "After trying several times, I could not resolve the account name for discord user {0}. This may be a temporary problem with the API. Falling back to NULL to fix another day.".formatUnicorn(responsible.username));
                                    accountName = null;
                                }
                                let unique = cl.db.storeAPIKey(m.member.user.id, m.guild.id, args.key, guid.toString(), accountName, r.name); // this cast should pass, since we either resolved by now or fell back to NULL
                                if (unique) {
                                    Util.log("info", "Authenticate.js", "Accepted {0} for {1} on {2} ({3}).".formatUnicorn(args.key, m.member.user.username, m.guild.name, m.guild.id));
                                    // FIXME: check if member actually has NULL as current role, maybe he already has one and entered another API key
                                    Util.assignServerRole(m.member, null, r);
                                    cl.discordLog(m.guild, AuthenticateCommand.LOG_TYPE_AUTH, L.get("DLOG_AUTH", [Util.formatUserPing(m.member.id), accountName, r.name]), false);
                                    reply = L.get("KEY_ACCEPTED");
                                }
                                else {
                                    Util.log("info", "Authenticate.js", "Duplicate API key {0} on server {1}.".formatUnicorn(args.key, m.guild.name));
                                    reply = L.get("KEY_NOT_UNIQUE");
                                }
                            }
                        }));
                        responsible.send(reply);
                    }));
                }
            }, err => {
                switch (err) {
                    case Util.validateWorld.ERRORS.config_world_duplicate:
                        Util.log("error", "Authenticate.js", "A world is defined more than once in the config. Please fix the config file.");
                        responsible.send(L.get("INTERNAL_ERROR"));
                        break;
                    case Util.validateWorld.ERRORS.network_error:
                        Util.log("error", "Authenticate.js", "Network error while trying to resolve world.");
                        responsible.send(L.get("INTERNAL_ERROR"));
                        break;
                    case Util.validateWorld.ERRORS.invalid_key:
                        Util.log("error", "Authenticate.js", "Invalid key: {0}".formatUnicorn(args.key));
                        responsible.send(L.get("KEY_DECLINED"));
                        break;
                    default:
                        Util.log("error", "Authenticate.js", "Unexpected error occured while validating world.");
                        Util.log("error", "Authenticate.js", err);
                        responsible.send(L.get("INTERNAL_ERROR"));
                }
            });
        }
    }
}
AuthenticateCommand.LOG_TYPE_AUTH = "auth";
exports.AuthenticateCommand = AuthenticateCommand;
module.exports = AuthenticateCommand;
