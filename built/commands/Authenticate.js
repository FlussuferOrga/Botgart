const { Command } = require("discord-akairo");
const Util = require.main.require("./src/Util.js");
const Const = require.main.require("./src/Const.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");
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
class AuthenticateCommand extends BotgartCommand {
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
        false // cronable
        );
    }
    desc() {
        return L.get("DESC_AUTHENTICATE");
    }
    command(message, responsible, guild, args) {
        Util.assertType(message, "Message");
        Util.assertType(responsible, "User");
        Util.assertType(args.key, "String");
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
            return message.util.send(L.get("KEY_INVALID_FORMAT"));
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
            let that = this;
            Util.validateWorld(args.key).then(role => {
                if (role === false) {
                    Util.log("info", "Authenticate.js", "Declined API key {0}.".formatUnicorn(args.key));
                    reply = L.get("KEY_DECLINED");
                    responsible.send(reply);
                }
                else {
                    Util.getAccountGUID(args.key).then(guid => {
                        members.forEach(m => {
                            let r = m.guild.roles.find(role => role.name === role);
                            if (!r) {
                                Util.log("error", "Authenticate.js", "Role '{0}'' not found on server '{1}'. Skipping.".formatUnicorn(role, m.guild.name));
                                reply = L.get("INTERNAL_ERROR");
                            }
                            else {
                                let unique = that.client.db.storeAPIKey(m.member.user.id, m.guild.id, args.key, guid);
                                if (unique) {
                                    Util.log("info", "Authenticate.js", "Accepted {0} for {1} on {2} ({3}).".formatUnicorn(args.key, m.member.user.username, m.guild.name, m.guild.id));
                                    // FIXME: check if member actually has NULL as current role, maybe he already has one and entered another API key
                                    Util.assignServerRole(m.member, null, r);
                                    //m.member.addRole(r).then(
                                    //    () => {},
                                    //    (err) => Util.log("error", "Authenticate.js", "Error while giving role to user: {0}".formatUnicorn(err.message))
                                    //);
                                    reply = L.get("KEY_ACCEPTED");
                                }
                                else {
                                    Util.log("info", "Authenticate.js", "Duplicate API key {0} on server {1}.".formatUnicorn(args.key, m.guild.name));
                                    reply = L.get("KEY_NOT_UNIQUE");
                                }
                            }
                        });
                        responsible.send(reply);
                    });
                }
            }, err => {
                switch (err) {
                    case Util.validateWorld.ERRORS.config_world_duplicate:
                        Util.log("error", "Authenticate.js", "A world is defined more than once in the config. Please fix the config file.");
                        break;
                    case Util.validateWorld.ERRORS.network_error:
                        Util.log("error", "Authenticate.js", "Network error while trying to resolve world.");
                        break;
                    default:
                        Util.log("error", "Authenticate.js", "Unexpected error occured while validating world.");
                        Util.log("error", "Authenticate.js", err);
                }
                responsible.send(L.get("INTERNAL_ERROR"));
            });
        }
    }
}
module.exports = AuthenticateCommand;
