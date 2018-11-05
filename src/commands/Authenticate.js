const { Command } = require('discord-akairo');
var Util = require('../Util.js');
var Const = require('../Const.js');
var L = require('../Locale.js');

class AuthenticateCommand extends Command {
    constructor() {
        super('authenticate', {
            aliases: ['register','authenticate','auth'],
            args: [
            	{
            		id: 'key',
	            	type: 'string',
	            	default: ''
            	}
            ]
        });
    }

    exec(message, args) {
    	if(!message.member) {
    		return; // direct message
    	}
    	// 4A820A42-000D-3B46-91B9-F7E664FEBAAEB321BE57-5FB1-4DF2-85A7-B88DD2202076
    	let validFormat = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{20}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(args.key)
    	if(!validFormat) {
    		return message.util.send(L.get("KEY_INVALID_FORMAT"));
    	}
		if(message.deletable) {
    		message.delete();
    	} else {
    		message.util.send(L.get("NO_DEL_PERM"));
    	}
		Util.validateWorld(args.key).then(function(isOnWorld) {
			if(isOnWorld) {
				let r = message.member.guild.roles.get("508766807021322241");
				console.log("Accepted", args.key);
				message.member.addRole(r);
				return message.util.send(L.get("KEY_ACCEPTED"));
			} else {
				console.log("Declined", args.key);
				return message.util.send(L.get("KEY_DECLINED"));
			}
    	});
    	console.log(L.get("KEY_ACCEPTED"));
    	return message.util.send(L.get("KEY_ACCEPTED"));
    }
}

module.exports = AuthenticateCommand;