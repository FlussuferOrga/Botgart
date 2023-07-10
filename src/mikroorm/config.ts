import {getConfig} from "../config/Config";
import {Options} from "@mikro-orm/better-sqlite";
import {Registration} from "./entities/Registration";
import {CaughtFish} from "./entities/CaughtFish";
import {Fish} from "./entities/Fish";
import {CommandPermission} from "./entities/CommandPermission";
import {CronJob} from "./entities/CronJob";
import {DiscordLogChannel} from "./entities/DiscordLogChannel";
import {FaqKey, Faq} from "./entities/Faq";
import {ResetRoster} from "./entities/ResetRoster";
import {ResetLeader} from "./entities/ResetLeader";
import {RandomFish} from "./entities/RandomFish";
import {FishingLadder} from "./entities/FishingLadder";
import path from "path";
import {logger} from "../util/Logging";
import {PermanentRole} from "./entities/PermanentRole";

const dbName = getConfig().get().db_location;
const LOG = logger({file: "mikroorm"});
const config: Options = {
    entities: [
        Registration,
        Fish,
        CaughtFish,
        CommandPermission,
        CronJob,
        DiscordLogChannel,
        Faq,
        FaqKey,
        ResetRoster,
        ResetLeader,
        RandomFish,
        FishingLadder,
        PermanentRole,
    ],
    dbName: dbName,
    debug: true,
    type: "better-sqlite",
    logger: (message) => LOG.info(message),
    migrations: {
        tableName: "schema_migrations",
        //migrationsList: [],
        path: path.join(__dirname, "migrations"),
        emit: "ts",
        safe: false,
    },
};

export default config;
