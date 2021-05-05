import { BotgartClient } from "../BotgartClient";
import { logger } from "../util/Logging";
import { Achievement } from "./Achievement";

//basically the type of the constructor function
type AchievementType = new (client: BotgartClient) => Achievement<never>

const achievementCreators: AchievementType[] = [];

export function registrableAchievement(target: AchievementType) {
    achievementCreators.push(target);
}

//this triggers loading the achievements, which are then collected by the decorator.
export * as allAchievements from "./Achievements";

// ---- AchievementRegistry ----
const LOG = logger();

export class AchievementRegistry {
    private readonly achievements: { [key: string]: Achievement<never> } = {};

    constructor(achievements: Achievement<never>[]) {
        LOG.info(`Registering achievements: [${achievements.map(value => value.name).join(", ")}].`);
        for (const achievement of achievements) {
            this.achievements[achievement.name.toLowerCase()] = achievement;
        }
    }

    public getAchievements(): Achievement<never>[] {
        return Object.values(this.achievements);
    }

    public getAchievement(name: string): Achievement<never> | undefined {
        const nameLower = name.toLowerCase();
        return nameLower in this.achievements ? this.achievements[nameLower] : undefined;
    }

    public static create(client: BotgartClient) {
        const achievements = achievementCreators.map(type => new type(client));
        return new AchievementRegistry(achievements);
    }

}


