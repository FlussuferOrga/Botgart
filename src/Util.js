var Const = require('./Const.js');
var gw2 = require('@cthos/gw2-api');
var api = new gw2.gw2();
api.setStorage(new gw2.memStore());

exports.validateWorld = function(apikey) {
	api.setAPIKey(apikey);
	return api.getAccount().then(function(res) {
		return res.world === Const.WorldId;
	});	
}
