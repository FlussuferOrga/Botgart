import * as http from "http";
import serverHealth from "server-health";
import { getConfig } from "./config/Config";
import { logger } from "./util/Logging";

const LOG = logger();

export class WebServer {
    private readonly server: http.Server;

    constructor() {
        // serverHealth.addConnectionCheck('database', function () {
        //     // determine whether database connection is up and functional
        //     return true;
        // });
        const options = {
            endpoint: "/health", // optional and will default to `/health`
        };
        this.server = serverHealth.createNodeHttpHealthCheckServer(options);
    }

    public async start() {
        return new Promise((resolve, reject) => {
            const httpConfig = getConfig().get().http;

            const startupErrorListener = (err) => {
                // not needed after it has been invoked
                this.server.removeListener("error", startupErrorListener);
                reject(err);
            };
            this.server.on("error", startupErrorListener);
            this.server.listen(parseInt(httpConfig.port), httpConfig.host, undefined, () => {
                // not needed since server is running now
                this.server.removeListener("error", startupErrorListener);

                LOG.info(`Web Server is listening on ${httpConfig.host}:${httpConfig.port} .`);

                this.server.on("error", WebServer.onError);
                resolve(null);
            });
        });
    }

    private static onError(err: Error) {
        LOG.error("Error in HTTP Server: " + err);
    }

    public async close() {
        if (this.server != undefined) {
            await this.server.removeListener("error", WebServer.onError);
            await this.server.close();
        }
    }
}
