const { Command } = require("discord-akairo");
const winston = require('winston');
var DB = require("../DB.js");
var Util = require("../Util.js");
var Const = require("../Const.js");
var L = require("../Locale.js");
var config = require("../../config.json");

class ReauthenticateCommand extends Command {
    constructor() {
        super("reauthenticate", {
            aliases: ["reauthenticate","reauth"],
            userPermissions: ['ADMINISTRATOR']
        });
    }

    command() {
        DB.revalidateKeys().then(function(prune) {
            let guild,r;
            prune.filter(p => p !== undefined).forEach(p => {
                if(!guild || guild.id != p.guild.id) {
                    // prunes come ordered by guild. This trick allows us to
                    // find each guild only once.
                    this.client.guilds.find(g => g.id === p.guild.id);
                    r = guild ? guild.roles.find(role => role.name === config.registered_role) : undefined;
                }
                if(!guild) {
                    winston.log("error", "Could not find a guild %s. Have I been kicked?", p.guild.id)
                } else {
                    if(!r) {
                        winston.log("error", "Could not find a role named %s on server %s.", guild.name, config.registered_role);
                    } else {
                        let m = guild.members.find(member => p.user == member.user.id);
                        if(m) {
                            winston.log("info", "Pruning %s.", m.user.username);
                            m.removeRole(r);
                            m.send(L.get("KEY_INVALIDATED"));
                        }
                    }
                }
                // delete in any case
                DB.deleteKey(p.api_key);
            });
        });
        winston.log("info", "Pruning complete.");      
    }

    exec(message) {
        this.command();
        return message.util.send(L.get("PRUNING_COMPLETE"));
    }
}

module.exports = ReauthenticateCommand;