import convict from "convict";
import fs from "fs";
import { Memoizer } from "memoizer-ts";
import * as Locale from "../Locale.js";
import { logger } from "../util/Logging.js";
import { isValidGuildWars2AccountHandle } from "./Validators.js";
import { Info, SystemZone } from "luxon";

const LOG = logger();

export type WorldAssignment = { world_id: number; role: string, link: boolean };
export type GuildAssignment = { guild_id: string; role: string};


const configSchema = {
    db_location: {
        doc: "database file to use",
        format: String,
        default: "./db/database.db",
        arg: "db-location",
        env: "db-location",
    },
    prefix: {
        doc: "Prefix to use in discord",
        format: val => {
            if (!/.+$/.test(val)) {
                throw new Error(`Prefix '${val.first_name}' is not a valid discord prefix`);
            }
        },
        default: ",",
        arg: "prefix",
        env: "command_prefix",
    },
    current_link_role: {
        doc: "Name of the current link role",
        format: String,
        default: "Linkingpartner",
        arg: "current_link_role",
        env: "CURRENT_LINK_ROLE",
    },
    locales: {
        doc: "Language",
        format: val => {
            if (!Array.isArray(val)) {
                throw new Error("Languages should be an array");
            }
            const availableLanguages = Locale.availableLanguages.map(language => language.abbreviation);
            for (const language of val) {
                if (!availableLanguages.includes(language)) {
                    throw new Error(`"${language}" is not an available language in ${availableLanguages}`);
                }
            }
        },
        default: ["DE", "EN"],
        arg: "locales",
        env: "LOCALES",
    },
    world_assignments: {
        doc: "World Role Mapping",
        format: "source-array",
        default: [],
        children: {
            world_id: {
                doc: "World Id",
                format: Number,
                default: null,
            },
            role: {
                doc: "Role Name",
                format: String,
                default: null,
            },
            link: {
                doc: "Is currently a link",
                format: Boolean,
                default: false,
            },
        },
    },
    guild_assignments: {
        doc: "Guild Role Mapping",
        format: "source-array",
        default: [],
        children: {
            guild_id: {
                doc: "Guild Id",
                format: String,
                default: null,
            },
            role: {
                doc: "Role Name",
                format: String,
                default: null,
            },
        },
    },
    owner_ids: {
        format: val => {
            if (!Array.isArray(val)) {
                throw new Error("Owner ids should be an array");
            }
            for (const singleOwnerId of val) {
                if (!/\d+$/.test(singleOwnerId)) {
                    throw new Error(`Owner id '${singleOwnerId}' is not a valid discord snowflake`);
                }
            }
        },
        default: [] as string[],
        arg: "owner-ids",
        env: "OWNER_IDS",
    },
    token: {
        format: val => {
            if (!/.+$/.test(val)) {
                throw new Error(`Token '${val.first_name}' is not a valid discord token`);
            }
        },
        default: "",
        arg: "token",
        env: "TOKEN",
    },
    timeZone: {
        arg: "timeZone",
        env: "TIME_ZONE",
        format: (val: string) => {
            if (!Info.isValidIANAZone(val)) {
                throw new Error(`'${val}' is not a valid time zone`);
            }
        },
        default: SystemZone.instance.name,
    },
    ts_unregister_protection: {
        format: values => {
            if (!Array.isArray(values)) {
                throw new Error("ts_unregister_protection should be an array");
            }
            for (const value of values) {
                if (!isValidGuildWars2AccountHandle(value)) {
                    throw new Error(`'${value}' is not a valid GuildWars 2 Account Handle`);
                }
            }
        },
        default: [] as string[],
        arg: "ts-unregister-protection",
        env: "TS_UNREGISTER_PROTECTION",
    },
    ts_commander_check_interval: {
        format: "nat",
        default: 300000,
        arg: "ts-commander-check-interval",
        env: "TS_COMMANDER_CHECK_INTERVAL",
    },
    ts_listener: {
        ip: {
            format: String,
            default: "localhost",
            arg: "ts-listener-ip",
            env: "TS_LISTENER_IP",
        },
        port: {
            format: "port",
            default: 10137,
            arg: "ts-listener-port",
            env: "TS_LISTENER_PORT",
        },
        channel_delay: {
            format: "nat",
            default: 300,
            arg: "ts-listener-channel-delay",
            env: "TS_LISTENER_CHANNEL_DELAY",
        },
        user_delay: {
            format: "nat",
            default: 300,
            arg: "ts-listener-user-delay",
            env: "TS_LISTENER_USER_DELAY",
        },
        grace_period: {
            format: Number,
            default: 60,
            arg: "ts-listener-grace-delay",
            env: "TS_LISTENER_GRACE_DELAY",
        },
        broadcast_channel: {
            format: String,
            default: "raid announcements",
            arg: "ts-listener-broadcast_channel",
            env: "TS_LISTENER_BROADCAST_CHANNEL",
        },
        ping_role: {
            format: String,
            default: "Raiders",
            arg: "ts-listener-ping-role",
            env: "TS_LISTENER_PING_ROLE",
        },
        ping_role_ppt: {
            format: String,
            default: "Raiders (PPT)",
            arg: "ts-listener-ping-role-ppt",
            env: "TS_LISTENER_PING_ROLE_PPT",
        },
        ping_role_ppk: {
            format: String,
            default: "Raiders (PPK)",
            arg: "ts-listener-ping-role-ppk",
            env: "TS_LISTENER_PING_ROLE_PPK",
        },
        commander_role: {
            format: String,
            default: "Commander",
            arg: "ts-listener-commander-role",
            env: "TS_LISTENER_COMMANDER_ROLE",
        },
    },
    http: {
        host: {
            format: String,
            default: "localhost",
            arg: "http-host",
            env: "HTTP_HOST",
        },
        port: {
            format: "port",
            default: "3000",
            arg: "http-port",
            env: "HTTP_PORT",
        },
    },
    disabled: {
        listeners: {
            format: Array,
            default: [] as string[],
            arg: "disabled-listeners",
            env: "DISABLED_LISTENERS",
        },
        commands: {
            format: Array,
            default: [] as string[],
            arg: "disabled-commands",
            env: "DISABLED_COMMANDS",
        },
        inhibitors: {
            format: Array,
            default: [] as string[],
            arg: "disabled-inhibitors",
            env: "DISABLED_INHIBITORS",
        },
    },
};

function logConfig(config) {
    let configJsonString = `${JSON.stringify(config.getProperties(), null, 2)}`;

    // probably we shouldn't log a token.
    configJsonString = configJsonString.replace(config.get().token, "***REDACTED***");
    LOG.verbose(`Resolved Configuration:\n${configJsonString}`);
}

function getConfigPath() {
    if (fs.existsSync("./config/config.json")) {
        return "./config/config.json";
    } else if (fs.existsSync("./config.json")) {
        return "./config.json";
    }
    return null;
}

function loadConfiguration() {
    try {
        convict.addFormat({
            name: "source-array",
            validate: function(sources, schema) {
                if (!Array.isArray(sources)) {
                    throw new Error("must be of type Array");
                }

                for (const source of sources) {
                    convict(schema.children).load(source).validate();
                }
            },
        });
        const config = convict(configSchema);

        const configPath = getConfigPath();
        if (configPath !== null) {
            LOG.info(`Loading config file ${configPath}`);
            config.loadFile(configPath);
        }

        logConfig(config);
        config.validate({ allowed: "strict" });// throws error if config does not conform to schema

        return config;
    } catch (e) {
        LOG.error("Could not load configuration: " + e);
        process.exit(1);
    }
}

const getConfigInternal = Memoizer.makeMemoized(loadConfiguration);

export function getConfig() {
    return getConfigInternal();
}