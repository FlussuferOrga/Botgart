import { log, setMinus } from "./Util";
import * as net from "net";
import CircularBuffer from "circular-buffer";


// shouldn't be too large, or else the lockout at start (two concurrent connections connecting at the same time)
// take ages to connect upon boot.
const RECONNECT_TIMER_MS = 30000; 

export class TS3Connection {
    private static CONNECTION_COUNTER: number = 1;
    private static CIRCULAR_BUFFER_SIZE: number = 4;

    private socket: net.Socket;
    private connected: boolean;
    private ip: string;
    private port: number;
    private name: string;
    private buffer: CircularBuffer<string>;

    public getSocket(): net.Socket {
        return this.socket;
    }

    public write(message : string): boolean {
        let sent: boolean = false;
        // ERR_STREAM_DESTROYED is a system error that will not cause
        // an exception, but instead halts the process, see:
        // https://nodejs.org/api/errors.html#errors_exceptions_vs_errors
        // So we must instead try to detect destroyed pipes gracefully
        if(!this.connected || this.socket.destroyed) { 
            this.buffer.enq(message);
        } else {
            try {
                this.socket.write(message);    
                sent = true;
            } catch(e) {
                this.buffer.enq(message);
            }    
        }
        //log("debug", "TS3Connection.js", `${this.name} Sending ${message}, ${sent}`);
        return sent;
    }

    public constructor(ts3ip, ts3port, name = null) {
        this.socket = new net.Socket();
        this.connected = false;
        this.ip = ts3ip;
        this.port = ts3port;
        this.name = name !== null ? name : `TS3Connection[${TS3Connection.CONNECTION_COUNTER++}]`;
        this.buffer = CircularBuffer<string>(TS3Connection.CIRCULAR_BUFFER_SIZE);

        const that = this;

        this.socket.on("connect", () => {
            log("info", "TS3Connection.js", "Successfully connected {0} to TS3-Bot on {1}:{2}".formatUnicorn(that.name, that.ip, that.port));
            that.connected = true;
            while(this.buffer.size() > 0) {
                log("debug", "TS3Connection.js", "Emptying buffer after re-establishing connection to TS3-Bot.");
                this.socket.write(this.buffer.deq()); // directly use the socket.write method to avoid endless loops when the socket is already broken again
            }
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
            } else if(e.message.includes("ECONNREFUSED")) {
                log("info", "TS3Connection.js", "TS3Bot is currently not reachable. Is the bot down? Attempting to connect again shortly.".formatUnicorn(that.name));
            }
            else {
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