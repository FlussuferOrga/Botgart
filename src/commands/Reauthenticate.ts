const { Command } = require("discord-akairo");
const { assertType, shallowInspect } = require.main.require("./src/Util.js");
const L = require.main.require("./src/Locale.js");
const config = require.main.require("./config.json");
const BotgartCommand = require.main.require("./src/BotgartCommand.js");

/**
Testcases:
- missing parameters -> error
- regular use -> reauth success
- remove a formerly valid API key with user still in guild -> key gets unauthenticated, user gets his auth role removed
- remove a formerly valid API key with user no longer in guild -> key gets unauthenticated
- cron: all of the above -> reauth success
*/
class ReauthenticateCommand extends BotgartCommand {
    constructor() {
        super("reauthenticate", {
            aliases: ["reauthenticate","reauth"],
            userPermissions: ['ADMINISTRATOR']
        },
        true, // available per DM
        true // cronable
        );
    }

    desc() {
        return L.get("DESC_REAUTHENTICATE");
    }

    command(message, responsible, guild, args) {
        assertType(responsible, "User");
        assertType(guild, "Guild");
        let that = this;
        this.client.db.revalidateKeys().then(
            prune => {
                // FIXME!! prune now is a list of tuples (player, admittedRole) where admittedRole is undefined if the player should not have any role
                let guild,role;
                // p is undefined if Util.validateWorld produced an error. Those can just be skipped (warnings should have been written by validateWorld already)
                prune.filter(p => p !== undefined).forEach(row => {
                    let [p,admittedRole] = row;

                    if(!guild || guild.id != p.guild) {
                        // prunes come ordered by guild. This trick allows us to
                        // find each guild only once.
                        guild = that.client.guilds.find(g => g.id == p.guild);
                        role = guild ? guild.roles.find(r => r.name === admittedRole) : undefined;
                    }
                    if(!guild) {
                        Util.log("error", "Reauthenticate.js", "Could not find a guild {0}. Have I been kicked?".formatUnicorn(p.guild))
                    } else {
                        if(!role) {
                            Util.log("error", "Reauthenticate.js", "Could not find a role named '{0}' on server {1}.".formatUnicorn(guild.name, admittedRole));
                        } else {
                            let m = guild.members.find(member => p.user == member.user.id);
                            if(m) {
                                Util.log("info", "Reauthenticate.js", "Pruning {0}.".formatUnicorn(m.user.username));
                                m.removeRole(role);
                                m.send(L.get("KEY_INVALIDATED"));
                            } else {
                                Util.log("info", "Reauthenticate.js", "{0} is no longer part of the guild.".formatUnicorn(p.user));
                            }
                            that.client.db.deleteKey(p.api_key);
                        }
                    }               
                });
            }
        );
        Util.log("info", "Reauthenticate.js", "Pruning complete.");      
    }

    postExecHook(message, args, result) {
        return message.util.send(L.get("PRUNING_COMPLETE"));
    }
}

module.exports = ReauthenticateCommand;