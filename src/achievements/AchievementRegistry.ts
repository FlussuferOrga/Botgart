import { BotgartClient } from "../BotgartClient";
import * as Util from "../Util";
import { Achievement } from "./Achievement";

//basically the type of the constructor function
type AchievementType = new (client: BotgartClient) => Achievement<any>

const achievementCreators: AchievementType[] = [];

export function registerAchievement() {
    return (target: AchievementType) => {
        achievementCreators.push(target);
    };
}

//this triggers loading the achievements, which are then collected by the decorator.
export * as allAchievements from './Achievements'

// ---- AchievementRegistry ----
export class AchievementRegistry {
    private readonly achievements: { [key: string]: Achievement<any> } = {};

    constructor(achievements: Achievement<any>[]) {
        Util.log("info", `Registering achievements: [${achievements.map(value => value.name).join(", ")}].`);
        for (let achievement of achievements) {
            this.achievements[achievement.name.toLowerCase()] = achievement;
        }
    }

    public getAchievements(): Achievement<any>[] {
        return Object.values(this.achievements);
    }

    public getAchievement(name: string): Achievement<any> | undefined {
        name = name.toLowerCase();
        return name in this.achievements ? this.achievements[name] : undefined;
    }

    public static create(client: BotgartClient) {
        const achievements = achievementCreators.map(type => new type(client));
        return new AchievementRegistry(achievements)
    }

}


