"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let config = require.main.require("../config.json");
const discord_akairo_1 = require("discord-akairo");
const Util_1 = require("../Util");
const validate = __importStar(require("validate.js"));
validate.validators.isArray = (value, options, key, attributes) => {
    options.message = options.message || (x => "not an array.");
    return validate.isArray(value) ? null : options.message(value);
};
validate.validators.all = (value, options, key, attributes) => {
    options.message = options.message || (x => "not all elements passed the qualification citerion.");
    return value.reduce((acc, x) => acc && options.func(x), true) ? null : options.message(value);
};
validate.validators.any = (value, options, key, attributes) => {
    options.message = options.message || (x => "not a single element passed the qualification criterion.");
    return value.reduce((acc, x) => acc || options.func(x), false) ? null : options.message(value);
};
class ReadyListener extends discord_akairo_1.Listener {
    constructor() {
        super("configchecker", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        var constraints = {
            owner_id: {
                presence: true,
                format: {
                    pattern: /^\d+$/,
                    message: function (value, attribute, validatorOptions, attributes, globalOptions) {
                        return validate.format("^%{num} is not a valid owner ID", {
                            num: value
                        });
                    }
                }
            },
            prefix: {
                presence: true,
                format: {
                    pattern: /.+$/,
                    message: function (value, attribute, validatorOptions, attributes, globalOptions) {
                        return validate.format("^%{pref} is not a valid prefix", {
                            pref: value
                        });
                    }
                }
            },
            token: {
                presence: true,
                format: {
                    pattern: /.+$/,
                    message: function (value, attribute, validatorOptions, attributes, globalOptions) {
                        return validate.format("^%{tok} is not a valid token", {
                            tok: value
                        });
                    }
                }
            },
            home_id: {
                presence: true,
                numericality: {
                    strict: true
                }
            },
            world_assignments: {
                presence: true,
                isArray: {},
                all: {
                    func: x => undefined === validate.validate(x, {
                        "world_id": {
                            presence: true,
                            numericality: {
                                strict: true
                            }
                        },
                        "role": {
                            presence: true
                        }
                    })
                }
            },
            disabled: {
                presence: true
            },
            "disabled.listeners": {
                presence: true,
                isArray: {}
            },
            "disabled.commands": {
                presence: true,
                isArray: {}
            },
            "disabled.inhibitors": {
                presence: true,
                isArray: {}
            }
        };
        let errors = validate.validate(config, constraints);
        for (let k in errors) {
            Util_1.log("error", "ConfigChecker.js", "Error while validating config entry '{0}': {1}".formatUnicorn(k, errors[k]));
        }
        if (errors) {
            Util_1.log("crit", "ConfigChecker.js", "Config contains invalid entries. Shutting down preventively. Please fix the config according to the log.");
            process.exit(1);
        }
        else {
            Util_1.log("info", "ConfigChecker.js", "Done checking config.json.");
        }
    }
}
exports.ReadyListener = ReadyListener;
module.exports = ReadyListener;
/*

{
    "owner_id": "227563459963912202",
    "prefix": "-",
    "token": "NTEyOTg4NzA4NjkwMTk4NTI5.DtBdnA.DZ1-4T6-LlPAqenp2iruHVkRwqI",
    "home_id": 2202,
    "world_assignments": [{"world_id": 2202, "role": "Flussufer"}],
    "ts": {
        "ip": "127.0.01",
        "port": 10011,
        "user": "admin",
        "password": "fqJE4Wkl"
    },
    "disabled": {
        "listeners": [],
        "commands": [],
        "inhibitors": []
    }
}
*/ 
