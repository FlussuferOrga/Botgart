const { Command } = require("discord-akairo");
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");

class ReauthenticateCommand extends Command {
    constructor() {
        super("reauthenticate", {
            aliases: ["reauthenticate","reauth"],
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
        DB.revalidateKeys().then(function(prune) {
            let r = message.guild.roles.find(role => role.name === config.registered_role);
            prune.filter(p => p !== undefined).forEach(p => {
                let m = message.guild.members.find(member => p.user == member.user.id);
                if(m) {
                    m.removeRole(r);
                    m.send(L.get("KEY_INVALIDATED"));
                }
            });
            
        });
        
        

        return message.util.send(L.get("PRUNING_COMPLETE"));
    }
}

module.exports = ReauthenticateCommand;