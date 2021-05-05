import callsites from "callsites";
import path from "path";
import * as winston from "winston";

function createLogger() {
    const defaultFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.simple(),
        winston.format.printf(({level, file, message, timestamp, ...rest}) => {
            let restString = "";
            if (Object.getOwnPropertyNames(rest).length > 0) {
                restString = " " + JSON.stringify(rest);
            }
            return `${timestamp} ${level} [${file}]: ${message}${restString}`;
        })
    );
    return winston.createLogger({
        levels: winston.config.cli.levels,
        format: defaultFormat,
        transports: [
            new winston.transports.Console({
                level: 'debug',
                format: winston.format.combine(
                    winston.format.colorize(),
                    defaultFormat
                )
            }),
            new winston.transports.File({
                filename: 'log/bot_combined.log',
                level: 'info'
            }),
            new winston.transports.File({
                filename: 'log/bot_errors.log',
                level: 'error'
            }),
            new winston.transports.File({
                filename: '/tmp/botgart_debug.log',
                level: 'debug'
            })
        ]
    });
}

const internalLogger = createLogger();

export function logger(options: Record<string, unknown> = {}): winston.Logger {
    const callFile: string[] = callsites()[1].getFileName()?.split(path.sep) ?? ["UNKNOWN"];
    const file = callFile[callFile.length - 1];
    return internalLogger.child({
        ...options,
        "file": file
    });
}

export function registerUnhandledRejection() {
    const log = createLogger();
    process.on("unhandledRejection", (reason, p) => {
        log.error(`Unhandled Rejection!`);
        // JSON.stringify does not handle errors and especially not Promises:
        // https://levelup.gitconnected.com/beware-of-using-json-stringify-for-logging-933f18626d51
        // The suggested solution there produces ugly output, so I am falling back to this to find proper errors during rejections
        /* eslint-disable no-console */
        console.error("Promise", p);
        console.error("Reason", reason);
        /* eslint-enable no-console */
    });
}