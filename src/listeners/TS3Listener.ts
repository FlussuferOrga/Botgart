let config = require.main.require("../config.json");
import { Listener } from "discord-akairo";
import { log } from "../Util";
const gw2 = require("gw2api-client");
const api = gw2();
const net = require('net');

export class TS3Listener extends Listener {
    constructor() {
        super("ts3listener", {
            emitter: "client",
            eventName: "ready"
        });
        console.log("there");
    }

    exec() {
        return;
        try {
            var client = new net.Socket();
            client.connect(10137, '127.0.0.1', function() {
                console.log('Connected');
                client.write('Hello, server! Love, Client.');
            });

            client.on('data', function(data) {
                data = JSON.parse(data);
                console.log('Received: ', data);
                //client.destroy(); // kill client after server's response
            });

            client.on('close', function() {
                console.log('Connection closed');
            });
        } catch(e) {
            // pass
        }
    }    
}

module.exports = TS3Listener;