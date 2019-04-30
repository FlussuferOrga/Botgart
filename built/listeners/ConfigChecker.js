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
class ReadyListener extends discord_akairo_1.Listener {
    constructor() {
        super("configchecker", {
            emitter: "client",
            eventName: "ready"
        });
    }
    exec() {
        var constraints = {
            creditCardNumber: {
                presence: true,
                format: {
                    pattern: /^(34|37|4|5[1-5]).*$/,
                    message: function (value, attribute, validatorOptions, attributes, globalOptions) {
                        return validate.format("^%{num} is not a valid credit card number", {
                            num: value
                        });
                    }
                },
                length: function (value, attributes, attributeName, options, constraints) {
                    if (value) {
                        // Amex
                        if ((/^(34|37).*$/).test(value))
                            return { is: 15 };
                        // Visa, Mastercard
                        if ((/^(4|5[1-5]).*$/).test(value))
                            return { is: 16 };
                    }
                    // Unknown card, don't validate length
                    return false;
                }
            },
            creditCardZip: function (value, attributes, attributeName, options, constraints) {
                if (!(/^(34|37).*$/).test(attributes.creditCardNumber))
                    return null;
                return {
                    presence: { message: "is required when using AMEX" },
                    length: { is: 5 }
                };
            }
        };
        validate.validate(config, constraints);
        Util_1.log("info", "ConfigChecker.js", "Done checking config.json.");
    }
}
exports.ReadyListener = ReadyListener;
module.exports = ReadyListener;
