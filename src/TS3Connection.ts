import { log, setMinus } from "./Util";
import * as net from "net";

const RECONNECT_TIMER_MS = 3000;

export class TS3Connection {
    private socket: net.Socket;
    private connected: boolean;
    private ip: string;
    private port: number;

    public getSocket(): net.Socket {
        return this.socket;
    }

    public constructor(ts3ip, ts3port) {
        this.socket = new net.Socket();
        this.connected = false;
        this.ip = ts3ip;
        this.port = ts3port;

        const that = this;

        this.socket.on("connect", () => {
            log("info", "TS3Connection.js", "Successfully connected to TS3-Bot on {0}:{1}".formatUnicorn(that.ip, that.port));
            that.connected = true;
        });

        this.socket.on("close", () => {
            that.connected = false;
            log("info", "TS3Connection.js", "(Re)connection to TS3-Bot failed. Will attempt reconnect in {0} milliseconds".formatUnicorn(RECONNECT_TIMER_MS));
            setTimeout(async () => {
                await this.connect().catch(e => {});
            }, RECONNECT_TIMER_MS);
        });

        this.socket.on("error", (e) => {
            //console.log(e);
        }); 

        this.connect();
    }

    private async connect() {
        this.socket.connect(this.port, this.ip);   
    }

    exec() {
        this.connect();
    }    
}