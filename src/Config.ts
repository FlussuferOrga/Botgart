import convict from "convict";
import * as Util from "./Util";

let configSchema = {
    prefix: {
        doc: 'Prefix to use in dicord',
        format: String,
        default: ',',
        arg: 'prefix',
        env: 'prefix'
    },
    home_id: {
        doc: 'Homeworld ID',
        format: Number,
        default: 2202, //Riverside FTW
        arg: 'home-id',
        env: 'HOME_ID'
    },
    world_assignments: {
        doc: 'World Role Mapping',
        format: Array,
        default: [{"world_id": 2202, "role": "rolename (must exist!)"}],
        arg: 'world-assignments',
        env: 'WORLD_ASSIGNMENTS'
    },
    owner_ids: {
        format: Array,
        default: [],
        arg: 'owner-ids',
        env: 'OWNER_IDS'
    },
    token: {
        format: String,
        default: '',
        arg: 'token',
        env: 'TOKEN'
    },
    ts_unregister_protection: {
        format: Array,
        default: [],
        arg: 'ts-unregister-protection',
        env: 'TS_UNREGISTER_PROTECTION'
    },
    ts_listener: {
        ip: {
            format: String,
            default: 'localhost',
            arg: 'ts-listener-ip',
            env: 'TS_LISTENER_IP'
        },
        port: {
            format: 'port',
            default: '10137',
            arg: 'ts-listener-port',
            env: 'TS_LISTENER_PORT'
        },
        channel_delay: {
            format: Number,
            default: 300,
            arg: 'ts-listener-channel-delay',
            env: 'TS_LISTENER_CHANNEL_DELAY'
        },
        user_delay: {
            format: Number,
            default: 300,
            arg: 'ts-listener-user-delay',
            env: 'TS_LISTENER_USER_DELAY'
        },
        grace_period: {
            format: Number,
            default: 60,
            arg: 'ts-listener-grace-delay',
            env: 'TS_LISTENER_GRACE_DELAY'
        },
        broadcast_channel: {
            format: String,
            default: 'raid announcements',
            arg: 'ts-listener-broadcast_channel',
            env: 'TS_LISTENER_BROADCAST_CHANNEL'
        },
        ping_role: {
            format: String,
            default: 'Raiders',
            arg: 'ts-listener-ping-role',
            env: 'TS_LISTENER_PING_ROLE'
        },
        commander_role: {
            format: String,
            default: 'Commander',
            arg: 'ts-listener-commander-role',
            env: 'TS_LISTENER_COMMANDER_ROLE'
        },
    },
    http:{
        host: {
            format: String,
            default: 'localhost',
            arg: 'http-host',
            env: 'HTTP_HOST'
        },
        port: {
            format: 'port',
            default: '3000',
            arg: 'http-port',
            env: 'HTTP_PORT'
        },
    },
    achievements: {
        channel: {
            format: String,
            default: 'achievements',
            arg: 'achievements-channel',
            env: 'ACHIEVEMENTS_CHANNEL'
        },
        ignoring_roles: {
            format: Array,
            default: ['covert'],
            arg: 'achievements-ignoring_roles',
            env: 'ACHIEVEMENTS_IGNORING_ROLES'
        },
    },
    gw2api: {
        delays: {
            wvw_stats: {
                format: Number,
                default: 10000,
                arg: 'gw2api-delays-wvw-stats',
                env: 'GW2API_DELAYS_WVW_STATS'
            },
            wvw_matches: {
                format: Number,
                default: 10000,
                arg: 'gw2api-delays-wvw-matches',
                env: 'GW2API_DELAYS_WVW_MATCHES'
            },
        }
    },
    disabled: {
        listeners: {
            format: Array,
            default: [],
            arg: 'disabled-listeners',
            env: 'DISABLED_LISTENERS'
        },
        commands: {
            format: Array,
            default: [],
            arg: 'disabled-commands',
            env: 'DISABLED_COMMANDS'
        },
        inhibitors: {
            format: Array,
            default: [],
            arg: 'disabled-inhibitors',
            env: 'DISABLED_INHIBITORS'
        },
    }
};

export const configuration = loadConfiguration();

function loadConfiguration() {
    let config = convict(configSchema);
    config.loadFile("./config.json");
    config.validate({allowed: 'strict'}); // throws error if config does not conform to schema

    logConfig(config);
    return config;
}

function logConfig(config:convict.Config<any>) {
    let configJsonString = `${JSON.stringify(config.getProperties(), null, 2)}`;

    //probably we shouldn't log a token.
    configJsonString = configJsonString.replace(config.get("token"),"***REDACTED***")

    Util.log("info", `Resolved Configuration:\n${configJsonString}`);
}

