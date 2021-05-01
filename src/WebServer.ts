import express, { Express } from "express";
import * as http from "http";
import { getConfig } from "./config/Config";
import { logger } from "./Logging";

// Create a new express app instance

const LOG = logger();

export class WebServer {
    private app: Express
    private server: http.Server;

    constructor() {
        this.app = express();
        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.get('/health', function (req, res) {
            res.send('OK');
        });
    }

    public start() {
        let httpConfig = getConfig().get().http;
        this.server = this.app.listen(parseInt(httpConfig.port), httpConfig.host, function () {
            LOG.info(`Web Server is listening on ${httpConfig.host}:${httpConfig.port} .`)
        });
    }

    public close() {
        if (this.server != undefined) {
            this.server.close();
        }
    }
}
