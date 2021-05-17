/* eslint-disable max-lines */
import * as discord from "discord.js";
import * as moment from "moment";
import { BotgartClient } from "../BotgartClient";
import { getConfig } from "../config/Config";
import * as gw2api from "../emitters/APIEmitter";
import { FactionColour, Matchup } from "../repositories/MatchupRepository";
import * as ts3 from "../TS3Connection";
import { logger } from "../util/Logging";
import * as U from "../util/Util";
import {
    Achievement,
    NewMatchupAchievement,
    ObjectiveAchievement,
    TagDownAchievement,
    TagUpAchievement
} from "./Achievement";
import { registrableAchievement } from "./AchievementRegistry";


// ------------------------------------------------------------------------------
// ACHIEVEMENTS
// ------------------------------------------------------------------------------
@registrableAchievement
export class Glimmer extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a9/Solar_Beam.png",
            "Schimmer",
            Achievement.EASY_COLOUR,
            false, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.registrationRepository.getUserByDiscordId(discordUser.user);
        return user ? this.client.tsLeadRepository.getTotalLeadTime(user.gw2account) > 3600 : false;
    }
}

@registrableAchievement
export class Sunray extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/37/Cosmic_Ray.png",
            "Sonnenstrahl",
            Achievement.EASY_COLOUR,
            false, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.registrationRepository.getUserByDiscordId(discordUser.user);
        return user ? this.client.tsLeadRepository.getTotalLeadTime(user.gw2account) > 3600 * 10 : false;
    }
}

@registrableAchievement
export class BlazingLight extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e6/Lunar_Impact.png",
            "Gleißendes Licht",
            Achievement.MEDIUM_COLOUR,
            false, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.registrationRepository.getUserByDiscordId(discordUser.user);
        return user ? this.client.tsLeadRepository.getTotalLeadTime(user.gw2account) > 3600 * 100 : false;
    }
}

@registrableAchievement
export class Supernova extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/ff/Astral_Wisp.png",
            "Supernova",
            Achievement.HARD_COLOUR,
            false, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const user = this.client.registrationRepository.getUserByDiscordId(discordUser.user);
        return user ? this.client.tsLeadRepository.getTotalLeadTime(user.gw2account) > 3600 * 1000 : false;
    }
}

@registrableAchievement
export class Trailblazer extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e1/Banner_of_Strength.png",
            "Vorreiter",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const rs: moment.Moment | undefined = context.commander.getRaidStart();
        const min: number = U.getResetTime().minute();
        const before: moment.Moment = U.getResetTime().minute(min - 20);
        const after: moment.Moment = U.getResetTime().minute(min + 20);
        return rs !== undefined && rs.weekday() === U.RESET_WEEKDAY && rs.isBetween(before, after) && context.commander.getRaidTime() > 3600;
    }
}

@registrableAchievement
export class Owl extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e3/Swoop_%28bird%29.png",
            "Eule",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return context.commander.getRaidStart() !== undefined
            && U.isBetweenTime(context.commander.getRaidStart() as moment.Moment, "23:00:00", "06:00:00")
            && context.commander.getRaidTime() > 3600;
    }
}

@registrableAchievement
export class Earlybird extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/3c/Hunter%27s_Call.png",
            "Früher Vogel",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return context.commander.getRaidStart() !== undefined
            && U.isBetweenTime(context.commander.getRaidStart() as moment.Moment, "06:00:00", "10:00:00")
            && context.commander.getRaidTime() > 3600;
    }
}

const LOG = logger();

@registrableAchievement
export class Annihilator extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/e/e4/Rampage.png",
            "Vernichter",
            Achievement.HARD_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { "commander": ts3.Commander; "objectives": gw2api.WvWMatches }): boolean {
        let holds = false;
        const obj = context.objectives;
        const ourTeam: [string, number[]] | undefined = Object.entries(obj.all_worlds).find(([key, value]) => value.includes(getConfig().get().home_id));
        if (ourTeam === undefined) {
            LOG.warn(`Could not find our home id '${getConfig().get().home_id}' within the matchup emitted by the API emitter. Only found ${Object.entries(obj.all_worlds)}. Either the config is broken or the emitter sends out faulty events.`);
        } else {
            const [ourColour, ourWorlds] = ourTeam;
            holds = obj.kills[ourColour] / obj.kills[ourColour] >= 2.0;
        }
        return holds;
    }
}

@registrableAchievement
export class NeverSurrender extends TagUpAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/6c/Vengeance_%28skill%29.png",
            "Niemals aufgeben!",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagUp): boolean {
        let holds: boolean = context.commander.getRaidStart() !== null;
        if (holds) {
            const stats = this.client.matchupRepository.getStatsAround(context.commander.getRaidStart());
            if (stats) {
                const ourColour = this.client.matchupRepository.getColourOf(getConfig().get().home_id, context.commander.getRaidStart());
                if (ourColour === undefined) {
                    const ts = context.commander.getRaidStart() !== undefined ? U.momentToLocalSqliteTimestamp(context.commander.getRaidStart() as moment.Moment) : "UNDEFINED";
                    LOG.warn(`Unable to find our colour with world ID ${getConfig().get().home_id} in a matchup around ${ts}.`);
                } else {
                    const ourStats = stats.find(s => s.faction === ourColour);
                    holds = ourStats
                        ? ourStats.kills > 1000 && ourStats.deaths > 1000 // make sure achievement is not awarded right at reset (sample morning of day 2 of matchup: ~6k kills)
                        && ourStats.kills / ourStats.deaths <= 0.6
                        : false;
                }
            }
        }

        return holds;
    }
}

@registrableAchievement
export class Conqueror extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/8/8d/Mind_Wrack.png",
            "Eroberer",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { "commander": ts3.Commander; "objectives": gw2api.WvWMatches }): boolean {
        let holds = false;
        const obj = context.objectives;
        const ourTeam: [string, number[]] | undefined = Object.entries(obj.all_worlds).find(([key, value]) => value.includes(getConfig().get().home_id));
        if (ourTeam === undefined) {
            LOG.warn(`Could not find our home id '${getConfig().get().home_id}' within the matchup emitted by the API emitter. Only found ${Object.entries(obj.all_worlds)}. Either the config is broken or the emitter sends out faulty events.`);
        } else {
            const [ourColour, ourWorlds] = ourTeam;
            const ppt: number = context.objectives.maps.reduce((teamPPT, m) => teamPPT + m.objectives
                .filter(o => o.owner === ourColour)
                .reduce((mapPPT, o) => mapPPT + o.points_tick, 0), 0);
            holds = ppt > 250;
        }
        return holds;
    }
}


@registrableAchievement// fix
export class UnchallengedSovereign extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/5/5f/Champion%27s_Crown.png",
            "Unbestrittener Beherrscher",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

@registrableAchievement
export class AgileDefender extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/33/Iron_Guards.png",
            "Agiler Verteidiger",
            Achievement.HARD_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        let holds: boolean = context.commander.getRaidStart() !== undefined
            && U.isBetweenTime(context.commander.getRaidStart() as moment.Moment, "18:00:00", "21:00:00")
            && context.commander.getRaidTime() > 3600; // raid was during prime time and went for at least an hour
        if (holds) {
            const ourColour = this.client.matchupRepository.getColourOf(getConfig().get().home_id, context.commander.getRaidStart());
            const t3AtStart: number[] = this.client.matchupRepository.getObjectivesAround(context.commander.getRaidStart())
                .filter(obj => obj.owner === ourColour && obj.tier === 3)
                .map(obj => obj.objective_id);
            if (t3AtStart.length >= 3) { // we held at least three t3 objectives when they started
                const lost = this.client.matchupRepository.capturedBetween(context.commander.getRaidStart() as moment.Moment, moment.utc().local())
                    .filter(c => c.old_owner === ourColour && c.old_tier === 3);
                holds = lost.length === 0; // we lost none of the t3 structures
            }
        }
        return holds;
    }
}


@registrableAchievement// fix
export class ThoroughCommander extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/8/85/Watchtower.png",
            "Gründlicher Kommandeur",
            Achievement.HARD_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

@registrableAchievement
export class BoldBesieger extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/32/Trebuchet_Blueprints.png",
            "Dreister Belagerer",
            Achievement.EASY_COLOUR,
            false, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const reg = this.client.registrationRepository.getUserByAccountName(context.commander.getAccountName());
        return reg ? this.client.matchupRepository.crashedT3ByCommander(getConfig().get().home_id, reg.gw2account) >= 10 : false;
    }
}

@registrableAchievement
export class TenaciousBesieger extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/63/Superior_Trebuchet_Blueprints.png",
            "Beharrlicher Belagerer",
            Achievement.MEDIUM_COLOUR,
            false, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        const reg = this.client.registrationRepository.getUserByAccountName(context.commander.getAccountName());
        return reg ? this.client.matchupRepository.crashedT3ByCommander(getConfig().get().home_id, reg.gw2account) >= 100 : false;
    }
}

@registrableAchievement
export class Princess extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/f2/Princess.png",
            "Prinzessin",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { "commander": ts3.Commander; "objectives": gw2api.WvWMatches }): boolean {
        const palaceID = "1099-114"; // https://api.guildwars2.com/v2/wvw/objectives?ids=1099-114
        const colour: FactionColour | undefined = this.client.matchupRepository.getFactionColour(moment.utc(), getConfig().get().home_id);
        return colour !== undefined
            && context.commander.getRaidStart() !== undefined
            && this.client.matchupRepository.wasCapturedBetween(context.commander.getRaidStart() as moment.Moment, moment.utc(), palaceID, colour);
    }
}


@registrableAchievement// fix
export class Castling extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/f/fd/Arcane_Thievery.png",
            "Rochade",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

@registrableAchievement
export class Ettin extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/46/Mirror_Images.png",
            "Ettin",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { "commander": ts3.Commander; "objectives": gw2api.WvWMatches }): boolean {
        return this.client.commanders.getActiveCommanders().filter(c => c.getRaidTime() > 3600).length >= 2;
    }
}

@registrableAchievement
export class Hydra extends ObjectiveAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/46/Mass_Invisibility.png",
            "Hydra",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { "commander": ts3.Commander; "objectives": gw2api.WvWMatches }): boolean {
        return this.client.commanders.getActiveCommanders().filter(c => c.getRaidTime() > 3600).length >= 3;
    }
}


@registrableAchievement// fix
export class Shiftchange extends TagUpAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/6/60/Phase_Retreat.png",
            "Schichtwechsel",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagUp): boolean {
        return false;
    }
}

@registrableAchievement
export class Bulletproof extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/2/24/Endure_Pain.png",
            "Kugelsicher",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return false;
    }
}

@registrableAchievement
export class Boozecommander extends Achievement<unknown> {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/1/16/Stein_of_Ale.png",
            "Promillekommandeur",
            Achievement.EASY_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: unknown): boolean {
        return false;
    }
}

@registrableAchievement
export class FromAshes extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/c/c1/Phoenix.png",
            "Aus der Asche",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { lastMatchup: Matchup; newMatchup: Matchup }): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 5 && context.newMatchup.tier === 4;
    }
}

@registrableAchievement
export class ThePresident extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://simpsonspedia.net/images/b/b8/Arnold_Schwarzenegger.png",
            "Der Präsident",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { lastMatchup: Matchup; newMatchup: Matchup }): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 4 && context.newMatchup.tier === 3;
    }
}

@registrableAchievement
export class MountainIsCalling extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/a/a1/Inspiring_Reinforcement.png",
            "Der Berg Ruft",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { lastMatchup: Matchup; newMatchup: Matchup }): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 3 && context.newMatchup.tier === 2;
    }
}

@registrableAchievement
export class ThePeak extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/c/c7/Fortify.png",
            "Der Gipfel",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { lastMatchup: Matchup; newMatchup: Matchup }): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === 2 && context.newMatchup.tier === 1;
    }
}

@registrableAchievement
export class TierSolidifier extends NewMatchupAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/3/31/%22Stand_Your_Ground%21%22.png",
            "Verfestiger",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: { lastMatchup: Matchup; newMatchup: Matchup }): boolean {
        return context.lastMatchup !== undefined && context.lastMatchup.tier === context.newMatchup.tier;
    }
}

@registrableAchievement
export class StaminaCommander extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/9/92/Savage_Leap.png",
            "Ausdauernder Kommandeur",
            Achievement.MEDIUM_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return context.commander.getRaidTime() > 3600 * 5;
    }
}

@registrableAchievement
export class InfiniteStamina extends TagDownAchievement {
    public constructor(client: BotgartClient) {
        super(client, "https://wiki.guildwars2.com/images/4/42/Rush.png",
            "Unerschöpfliche Ausdauer",
            Achievement.HARD_COLOUR,
            true, // repeatable
            false // announce repeats
        );
    }

    checkCondition(discordUser: discord.GuildMember, context: ts3.TagDown): boolean {
        return context.commander.getRaidTime() > 3600 * 10;
    }
}