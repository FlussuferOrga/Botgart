import callsites from "callsites";
import * as winston from "winston";

export function getErrorMessageWithCausedByParts(err: Error, stack = true): string {
    const doNewLines = stack;
    let txt = "";

    if (stack) {
        txt += err.stack;
    } else {
        txt += err.message;
    }

    if (err.cause != null) {
        if (err.cause instanceof Error) {
            if (doNewLines) {
                txt += "\n[caused by] ";
            } else {
                txt += " [caused by] ";
            }

            txt += getErrorMessageWithCausedByParts(err.cause, stack);
        } else {
            txt += `[Unknown cause type?!]: ${JSON.stringify(err.cause)}`;
        }
    }

    return txt;
}

const SPLAT = Symbol.for("splat");

function indent(string: string) {
    const regex = /^(?!\s*$)/gm;
    return string.replace(regex, "    ");
}

function createLogger() {
    const defaultFormat = winston.format.combine(
        // winston.format.errors({ stack: true, cause: true }),
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.simple(),
        //
        winston.format.printf(({ level, file, message, timestamp, stack, cause, err, name, ...rest }) => {
            let restString = "";
            if (Object.getOwnPropertyNames(rest).length > 0) {
                restString = "\n" + indent(JSON.stringify(rest));
            }

            let text = `${timestamp} ${level} [${file}]: ${message}${restString}`;

            const splat = rest[SPLAT];
            if (err !== undefined && err instanceof Error) {
                text = text + "\n" + indent(getErrorMessageWithCausedByParts(err));
            } else if (splat !== undefined && splat.length > 0) {
                const parts: unknown[] = splat;
                for (const part of parts) {
                    if (part instanceof Error) {
                        text = text + "\n" + indent(getErrorMessageWithCausedByParts(part));
                    }
                }
            } else {
                if (cause !== undefined || stack !== undefined) {
                    const err = { stack, cause, name };
                    if (err) {
                        text = text + "\n" + indent(getErrorMessageWithCausedByParts(err as Error));
                    }
                }
            }
            return text;
        })
    );
    const options = {
        levels: winston.config.cli.levels,
        handleExceptions: true,
        format: defaultFormat,
        transports: [
            new winston.transports.Console({
                level: "debug",
                format: winston.format.combine(winston.format.colorize(), defaultFormat),
            }),
            new winston.transports.File({
                filename: "log/bot_combined.log",
                level: "info",
            }),
            new winston.transports.File({
                filename: "log/bot_errors.log",
                level: "error",
            }),
        ],
    };

    // hack from https://github.com/winstonjs/winston/issues/1673
    options.transports = options.transports.map((value) =>
        Object.assign(value, {
            handleExceptions: true,
            handleRejections: true,
        })
    );

    return winston.createLogger(options);
}

const internalLogger = createLogger();

export function logger(options: Record<string, unknown> = {}): winston.Logger {
    let childLoggerOpts = {
        ...options,
    };
    if (!childLoggerOpts.file) {
        const callFile: string[] = callsites()[1].getFileName()?.split("/") ?? ["UNKNOWN"];
        childLoggerOpts.file = callFile[callFile.length - 1];
    }
    return internalLogger.child(childLoggerOpts);
}
