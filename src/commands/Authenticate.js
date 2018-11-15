const { Command } = require("discord-akairo");
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");

class AuthenticateCommand extends Command {
    constructor() {
        super("authenticate", {
            aliases: ["register","authenticate","auth"],
            args: [
                {
                    id: "key",
                    type: "string",
                    default: ""
                }
            ]
        });
    }

    exec(message, args) {
        if(!message.member) {
            return; // direct message
        }
        // 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111
        let validFormat = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{20}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(args.key)
        if(!validFormat) {
            return message.util.send(L.get("KEY_INVALID_FORMAT"));
        }
        if(message.deletable) {
            message.delete();
        } else {
            message.util.send(L.get("NO_DEL_PERM"));
        }
        Util.validateWorld(args.key).then(isOnWorld => {
            if(isOnWorld) {
                let r = message.member.guild.roles.find(role => role.name === config.registered_role);
                if(!r) {
                    console.error("Role not found: " + config.registered_role);
                    return message.util.send(L.get("REG_ROLE_NOT_FOUND"));
                } else {
                    let uid = message.member.user.id;
                    DB.storeAPIKey(uid, args.key);
                    console.log("Accepted", args.key, message.member.displayName);
                    message.member.addRole(r);
                    return message.util.send(L.get("KEY_ACCEPTED"));    
                }       
            } else {
                console.log("Declined", args.key);
                return message.util.send(L.get("KEY_DECLINED"));
            }
        }, err => {});
        return message.util.send(L.get("CHECKING_KEY"));
    }
}

module.exports = AuthenticateCommand;