import express, {Express} from "express";
import * as http from "http";
import {configuration} from "./config/Config";

// Create a new express app instance

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
        let httpConfig = configuration.get().http;
        this.server = this.app.listen(parseInt(httpConfig.port), httpConfig.host, function () {
            console.log(`Listening on ${httpConfig.host}:${httpConfig.port} .`);
        });
    }

    public close() {
        this.server.close();
    }
}
