import { getConfig } from "../config/Config.js";
import { Options } from "@mikro-orm/better-sqlite";
import { Registration } from "./entities/Registration.js";
import { CaughtFish } from "./entities/CaughtFish.js";
import { Fish } from "./entities/Fish.js";
import { CommandPermission } from "./entities/CommandPermission.js";
import { CronJob } from "./entities/CronJob.js";
import { DiscordLogChannel } from "./entities/DiscordLogChannel.js";
import { FaqKey, Faq } from "./entities/Faq.js";
import { ResetRoster } from "./entities/ResetRoster.js";
import { ResetLeader } from "./entities/ResetLeader.js";
import { RandomFish } from "./entities/RandomFish.js";
import { FishingLadder } from "./entities/FishingLadder.js";
import path from "path";
import { logger } from "../util/Logging.js";
import { PermanentRole } from "./entities/PermanentRole.js";
import { fileURLToPath } from "url";

const dbName = getConfig().get().db_location;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG = logger({ file: "mikroorm" });
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
