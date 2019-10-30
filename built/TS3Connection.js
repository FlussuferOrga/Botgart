"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("./Util");
const net = __importStar(require("net"));
const RECONNECT_TIMER_MS = 3000;
class TS3Connection {
    constructor(ts3ip, ts3port) {
        this.socket = new net.Socket();
        this.connected = false;
        this.ip = ts3ip;
        this.port = ts3port;
        const that = this;
        this.socket.on("connect", () => {
            Util_1.log("info", "TS3Connection.js", "Successfully connected to TS3-Bot on {0}:{1}".formatUnicorn(that.ip, that.port));
            that.connected = true;
        });
        this.socket.on("close", () => {
            that.connected = false;
            Util_1.log("info", "TS3Connection.js", "(Re)connection to TS3-Bot failed. Will attempt reconnect in {0} milliseconds".formatUnicorn(RECONNECT_TIMER_MS));
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield this.connect().catch(e => { });
            }), RECONNECT_TIMER_MS);
        });
        this.socket.on("error", (e) => {
            //console.log(e);
        });
        this.connect();
    }
    getSocket() {
        return this.socket;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.socket.connect(this.port, this.ip);
        });
    }
    exec() {
        this.connect();
    }
}
exports.TS3Connection = TS3Connection;
