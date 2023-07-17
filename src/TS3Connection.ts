import * as http from "http";
import { LeadType } from "./Commanders";

export interface TS3Commander {
    readonly account_name: string;
    readonly ts_cluid: string;
    readonly ts_display_name: string;
    readonly ts_channel_name: string;
    readonly ts_channel_path: string[];
    readonly ts_join_url: string;
    readonly leadtype?: LeadType;
}

interface HTTPRequestOptions {
    readonly hostname?: string;
    readonly port?: number;
    readonly path?: string;
    readonly method?: "GET" | "POST" | "PUT" | "DELETE";
    readonly headers?: {
        "Content-Type": "application/json";
        "Content-Length": number;
    };
}

export class TS3Connection {
    private static CONNECTION_COUNTER = 1;

    private host: string;
    private port: number;
    private name: string;

    private async request(data: unknown, options: HTTPRequestOptions): Promise<string> {
        const dataString: string = JSON.stringify(data);
        const defaults: HTTPRequestOptions = {
            hostname: this.host,
            port: this.port,
            path: "/",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(dataString),
            },
        };
        const settings: HTTPRequestOptions = options === undefined ? defaults : { ...defaults, ...options };
        return new Promise<string>((resolve, reject) => {
            const req = http.request(settings, (response) => {
                let body = "";
                response.on("data", (chunk) => (body += chunk));
                response.on("end", () => resolve(body));
            });
            req.on("error", reject);
            req.write(dataString);
            req.end();
        });
    }

    public async get(command: string, args: unknown = {}): Promise<string> {
        return this.request(args, {
            path: command,
            method: "GET",
        });
    }

    public async post(command: string, args: unknown = {}): Promise<string> {
        return this.request(args, {
            path: command,
            method: "POST",
        });
    }

    public async delete(command: string, args: unknown = {}): Promise<string> {
        return this.request(args, {
            path: command,
            method: "DELETE",
        });
    }

    public constructor(ts3host: string, ts3port: number, name?: string) {
        this.host = ts3host;
        this.port = ts3port;
        this.name = name !== undefined ? name : `TS3Connection[${TS3Connection.CONNECTION_COUNTER++}]`;
    }
}
