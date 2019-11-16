import { log, setMinus } from "./Util";
import * as net from "net";

// shouldn't be too large, or else the lockout at start (two concurrent connections connecting at the same time)
// take ages to connect upon boot.
const RECONNECT_TIMER_MS = 5000; 

export class TS3Connection {
    private static CONNECTION_COUNTER: number = 1;

    private socket: net.Socket;
    private connected: boolean;
    private ip: string;
    private port: number;
    private name: string;

    public getSocket(): net.Socket {
        return this.socket;
    }

    public write(message : string): void {
        log("debug", "TS3Connection.js", `${this.name} Sending ${message}`);
        this.socket.write(message);
    }

    public constructor(ts3ip, ts3port, name = null) {
        this.socket = new net.Socket();
        this.connected = false;
        this.ip = ts3ip;
        this.port = ts3port;
        this.name = name !== null ? name : `TS3Connection[${TS3Connection.CONNECTION_COUNTER++}]`;

        const that = this;

        this.socket.on("connect", () => {
            log("info", "TS3Connection.js", "Successfully connected {0} to TS3-Bot on {1}:{2}".formatUnicorn(that.name, that.ip, that.port));
            that.connected = true;
            this.socket.write(that.name);
        });

        this.socket.on("close", () => {
            that.connected = false;
            log("info", "TS3Connection.js", "(Re)connection to TS3-Bot failed. Will attempt to reconnect {0} in {1} milliseconds".formatUnicorn(that.name, RECONNECT_TIMER_MS));
            setTimeout(async () => {
                await this.connect().catch(e => {});
            }, RECONNECT_TIMER_MS);
        });

        this.socket.on("error", (e) => {
            if(e.message.includes("EALREADY")) {
                // when doing multiple unblocking connects from one IP,
                // the server may reject one with error EALREADY, which means
                // another connection is in the process of connecting. 
                // In that case, we just wait a bit and retry (caught through onclose)
                log("info", "TS3Connection.js", "Lockout during TS3Connections. Reconnecting {0} shortly.".formatUnicorn(that.name));
            } else {
                console.log(e);
            }
            
        }); 
        this.connect();
    }

    private async connect() {
        await this.socket.connect(this.port, this.ip);  
    }

    exec() {
        this.connect();
    }    
}