import gw2client from "gw2api-client";
import { logger } from "./util/Logging.js";

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
