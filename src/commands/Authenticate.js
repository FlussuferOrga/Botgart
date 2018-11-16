const { Command } = require("discord-akairo");
const winston = require('winston');
const DB = require("../DB.js");
const Util = require("../Util.js");
const Const = require("../Const.js");
const L = require("../Locale.js");
const config = require("../../config.json");

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
        let isDirectMessage = message.member !== undefined;
        let members = [];
        let reply = "";
        if(!isDirectMessage) {
            members.append({"guild": message.member, "member": message.member.guild})
        } else {
            // this snippet allows users to authenticate themselves
            // through a DM and is dedicated to Jey, who is a fucking 
            // numbnut when it comes to data privacy and posting your
            // API key in public channels.
            this.client.guilds.forEach(function(g) {
                let m = g.members.find(m => m.id === message.author.id);
                if(m) {
                    members.push({"guild": g, "member": m});
                }
            });
        }

        message.util.send(L.get("CHECKING_KEY"))
        // 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111
        let validFormat = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{20}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(args.key)
        if(!validFormat) {
            return message.util.send(L.get("KEY_INVALID_FORMAT"));
        } else {
            // try to delete the message for privacy reasons
            if(!isDirectMessage) {
                if(message.deletable) {
                    message.delete();
                } else {
                    message.util.send(L.get("NO_DEL_PERM"));
                }
            }
            Util.validateWorld(args.key).then(isOnWorld => {
                if(isOnWorld === true) {
                    Util.getAccountGUID(args.key).then(guid => {
                        members.forEach(function(m) {
                            let r = m.guild.roles.find(role => role.name === config.registered_role);
                            if(!r) {
                                winston.log("error", "Role {0} not found on server {1}. Skipping.".formatUnicorn(config.registered_role, g.name));
                            } else {
                                let unique = DB.storeAPIKey(m.member.user.id, m.guild.id, args.key, guid);
                                if(unique) {
                                    winston.log("info", "Accepted {0} for {1} on {2}.".formatUnicorn(args.key, m.member.user.username, m.guild.name));
                                    m.member.addRole(r);
                                    reply = L.get("KEY_ACCEPTED")

                                } else {
                                    winston.log("info", "Duplicate API key {0} on server {1}.".formatUnicorn(args.key, m.guild.name));
                                    reply = L.get("KEY_NOT_UNIQUE")
                                }
                            }
                            message.util.send(reply);
                        })
                    });   
                } else {
                    winston.log("info","Declined API key ${args.key}.");
                    reply = L.get("KEY_DECLINED");
                }
            }, err => {
                winston.log("error","Error occured while validating world.", err);
            });
        }
    }
}

module.exports = AuthenticateCommand;