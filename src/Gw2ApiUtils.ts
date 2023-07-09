import gw2client from "gw2api-client";
import { getConfig, WorldAssignment } from "./config/Config";
import { logger } from "./util/Logging";

export abstract class UnsuccessfulValidationError extends Error {}

export class NetworkError extends UnsuccessfulValidationError {}

export class InvalidKeyError extends UnsuccessfulValidationError {}

export class ConfigError extends UnsuccessfulValidationError {}

function isBadToken(err) {
    if (err.response) {
        if (err.response.status == 400) {
            return (
                err.content.text === "invalid key" ||
                err.content.text === "Invalid access token" ||
                err.content.text === "account does not have game access"
            );
        }
    }
    return false;
}

export function createApiInstance() {
    const api = gw2client();
    api.schema("2019-03-26T00:00:00Z");
    api.language("en");

    // retry some times and be polite about it
    api.fetch.retry((tries, err) => {
        if (isBadToken(err)) {
            return tries <= 2;
        }
        return tries <= 5;
    });
    api.fetch.retryWait((tries) => tries * 3000);

    return api;
}

const api = createApiInstance();

const LOG = logger();

export interface AccountData {
    id: string;
    world: number;
    name: string;
}

export async function getAccountInfo(apikey: string): Promise<AccountData> {
    try {
        const api = createApiInstance();
        api.authenticate(apikey);
        return await api.account().get();
    } catch (err) {
        LOG.error(
            "Encountered an error while trying to validate a key. This is most likely an expected error: {0}".formatUnicorn(JSON.stringify(err))
        );
        if (isBadToken(err)) {
            throw new InvalidKeyError("API Key is invalid");
        } else {
            throw new NetworkError(err);
        }
    }
}

export async function guildExists(guildname: string): Promise<boolean> {
    // we need to verify by name after looking up the ID
    // because the lookup by ID is case insensitive.
    return await api
        .authenticate(false)
        .guild()
        .search()
        .name(guildname)
        .then(async (id) => id !== undefined && (await api.authenticate(false).guild().get(id)).name === guildname);
}

/*
UNUSED:


/!**
 * Finds the colour of a world specified by its ID in its current matchup.
 *
 * @param worldId - the ID of the world to find the colour for
 * @returns Promise "red", "blue" or "green" if it could be resolved or Promise<null> if the ID could not be resolved.
 *!/
export function resolveMatchColour(worldId: number): Promise<"red"|"blue"|"green"|null> {
    return api.wvw().matches().overview().world(worldId).then(
        matchUp => {
            let home = Object.keys(matchUp.all_worlds)
                .map(k => matchUp.all_worlds[k].includes(worldId) ? k : null)
                .filter(x => x !== null)
            if(home.length !== 1) {
                log("error", "Expected to find world with ID = {0} in exactly one team. But found it in {1} teams.".formatUnicorn(worldId, home.length));
            }
            return home[0];
        },
        err => {
            log("error", "Error '{0}' when trying to resolve colour for world with ID = {1}".formatUnicorn(err.content.text, worldId));
            return null;
        }
    );
}


let mapAliasesPairs : [string, string[]][] = [
    ["Center",   ["ebg", "ewige", "es"]],
    ["BlueHome", ["blaue", "blue", "bgl", "bbl"]],
    ["GreenHome",["grüne", "green", "ggl", "gbl"]],
    ["RedHome",  ["rote", "red", "rgl", "rbl", "wüste", "dessert"]],
    ["homes",    ["home", "homes", "heimat"]]
];

let mapAliases = mapAliasesPairs
    .reduce((acc, [k,vs]) => { vs.map(v => acc[v] = k); return acc; }, {});


/!**
 * Tries to resolve the given user input to a standard world name.
 *
 * @param userInput - what the user typed as string for the map name
 * @returns a Promise resolving to a pair to either
 *        [true, the resolved name] (special case, strings akin to "home" are resolved to the current home map, as specified in the config)
 *      , [false, the original user input]
 *!/
export function resolveWvWMap(userInput: string): Promise<[boolean, string]> {
    let res: Promise<[boolean, string]> = new Promise((resolve, reject) => resolve([false, null]));
    if(userInput !== null && userInput !== undefined) {
        let best = stringSimilarity.findBestMatch(userInput, Object.keys(mapAliases)).bestMatch;
        if(best.rating === 0) {
            // could not resolve to anything
            res = new Promise((resolve, reject) => resolve([false, userInput]));
        } else {
            let m = mapAliases[best.target];
            if(m === "homes") {
                // resolve home colour
                res = resolveMatchColour(configuration.get().home_id).then(
                    home => new Promise((resolve, reject) => resolve([true, mapAliases[home]]))
                );
            } else {
                // resolved properly
                res = new Promise((resolve, reject) => resolve([true, m]));
            }
        }
    }
    return res;
}

/!**
 * Tries to resolve user input to a proper (localised) objective name.
 *
 * @param objectiveInput - whatever the user inputs as the objective name
 * @param mapInput - whatever the user inputs as the map name. Optional, if nothing is put here, ambiguities on alpine borderlands may occur
 * @returns a Promise resolving to either
 *    [<resolved objective name>:string, <resolved map name>:string, <map id>:number, <objective id>:string] if we found a promising match
 *    [<original user objective input>:string, <original user map input>: string, null, null] if no match could be found
 *!/
export function resolveWvWObjective(objectiveInput: string, mapInput?: string): Promise<[string,string,number,string]|[string,string,null,null]> {
    return api.language("de").wvw().objectives().all().then(
        res => resolveWvWMap(mapInput)
            .then(([resolved, wvwMap]) => {
                let mapFilter = resolved ? [wvwMap] : ["BlueHome", "RedHome", "GreenHome", "Center"];
                let objectives = res
                    .filter(o => o.map_id != 94) // filter out the obsolete red alpine borderland
                    .filter(o => mapFilter.includes(o.map_type))
                    .filter(o => ["Camp", "Tower", "Keep"].includes(o.type))
                    .map(o => [o.name, o])
                    .reduce((acc, [k,v]) => { acc[k] = v; return acc; }, {});
                let best = stringSimilarity.findBestMatch(objectiveInput, Object.keys(objectives)).bestMatch;
                return new Promise((resolve, reject) => {
                    resolve(best.rating === 0
                        ? [objectiveInput, wvwMap, null, null]
                        : [best.target, wvwMap, objectives[best.target].map_id, objectives[best.target].id])
                });
            })
    );
}

*/
