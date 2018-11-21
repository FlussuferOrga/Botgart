const { Command } = require("discord-akairo");
const winston = require("winston");
const { assertType } = require.main.require("./src/Util.js");
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
        this.client.db.revalidateKeys().then(function(prune) {
            let guild,r;
            prune.filter(p => p !== undefined).forEach(p => {
                if(!guild || guild.id != p.guild.id) {
                    // prunes come ordered by guild. This trick allows us to
                    // find each guild only once.
                    this.client.guilds.find(g => g.id === p.guild.id);
                    r = guild ? guild.roles.find(role => role.name === config.registered_role) : undefined;
                }
                if(!guild) {
                    winston.log("error", "Reauthenticate.js: Could not find a guild %s. Have I been kicked?", p.guild.id)
                } else {
                    if(!r) {
                        winston.log("error", "Reauthenticate.js: Could not find a role named %s on server %s.", guild.name, config.registered_role);
                    } else {
                        let m = guild.members.find(member => p.user == member.user.id);
                        if(m) {
                            winston.log("info", "Reauthenticate.js: Pruning %s.", m.user.username);
                            m.removeRole(r);
                            m.send(L.get("KEY_INVALIDATED"));
                        }
                    }
                }
                // delete in any case
                this.client.db.deleteKey(p.api_key);
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