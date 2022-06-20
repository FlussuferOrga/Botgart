import { Guild, Role } from "discord.js";
import moment from "moment-timezone";
import "./string.extensions";

export const RESET_WEEKDAY = 5; // FRIDAY

export function sqliteTimestampToMoment(str: string): moment.Moment {
    return moment(str, "YYYY-MM-DD HH:mm:ss");
}

export function isBetweenTime(m: moment.Moment, t1: string, t2: string): boolean {
    return m.isBetween(moment(t1, "HH:mm:ss"), moment(t2, "HH:mm:ss"));
}

export function getResetTime(): moment.Moment {
    return moment("18:00:00 +0000", "HH:mm:ss Z").local();
}

export function momentToLocalSqliteTimestamp(mom: moment.Moment): string {
    return mom.local().format("YYYY-MM-DD HH:mm:ss");
}

// https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_Expressions
export function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& is the entired matched string
}

/**
 * Capitalises the first letter of the passed string.
 * Even if it contains multiple words.
 * word: the string to capitalise.
 * returns: the capitalised string.
 *          "foo" -> "Foo", "Foo" -> "Foo", "foo bar" -> "Foo bar"
 */
export function capitalise(word: string) {
    return word.length === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1);
}

export function determineTier(yaksDelivered: number) {
    const yd = Math.floor(yaksDelivered / 10);
    return yd < 1 ? 0 : Math.min(3, Math.floor(Math.log2(yd)));
}

/**
 * Tries to parse a date from a string that can be used for the node-schedule library.
 * That is: either a valid date (format can be specified by the second parameter) or a cron-like string (https://crontab.guru/).
 * input: the input to parse
 * dateFormat: the date format to try to parse the string into. Default is the usual German format DD.MM.YYYY H:m
 * returns: a moment object, if the input was parsed to a date,
 or the input string, if it was parsed to a cron-like string,
 or false, if the input could not be parsed to either format.
 */
export function parseCronDate(input: string, dateFomat = "DD.MM.YYYY H:m"): string | moment.Moment | boolean {
    if (input === "") { // empty strings are "valid dates"
        return false;
    }
    let res: string | moment.Moment | boolean = moment(input, dateFomat, true);
    if (!res.isValid()) {
        res = /^(\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*)$/.test(input)
            ? input
            : false;
    }
    return res;
}

/**
 * Compares two dates without considering the time component
 * and normalised to UTC, to avoid summer-winter-conflicts.
 * -> 2019-12-24 13:00 === 2019-12-24 6:23
 * d1: first date
 * d2: second date
 * returns: true if both dates are equal in day, month, and year
 */
export function compareDatesWithoutTime(d1: Date, d2: Date) {
    return d1.getUTCDate() == d2.getUTCDate()
        && d1.getUTCMonth() == d2.getUTCMonth()
        && d1.getUTCFullYear() == d2.getUTCFullYear();
}

export function formatUserPing(uid: string) {
    return "<@{0}>".formatUnicorn(uid);
}

export async function asyncForEach(array, callback) {
    for (let i = 0; i < array.length; i++) {
        await callback(array[i], i, array);
    }
}

export function setEqual<T>(s1: Set<T>, s2: Set<T>): boolean {
    // https://stackoverflow.com/a/44827922
    return s1.size === s2.size && [...s1].every(value => s2.has(value));
}

export function setMinus<T>(s1: Iterable<T>, s2: Set<T>): Set<T> {
    return new Set(Array.from(s1).filter(x => !s2.has(x)));
}

export interface Equalable<T> {
    equals: (other: T) => boolean;
}

export class GeneralSet<T extends Equalable<T>> implements Iterable<T> {
    private elements: T[];

    constructor() {
        this.elements = [];
    }

    public size(): number {
        return this.elements.length;
    }

    public [Symbol.iterator](): Iterator<T> {
        return this.elements.values();
    }

    public find(item: T): number {
        let i = 0;
        while (i < this.elements.length && !this.elements[i].equals(item)) {
            i++;
        }
        return i < this.elements.length ? i : -1;
    }

    public has(item: T): boolean {
        return this.find(item) > -1;
    }

    public add(item: T): boolean {
        let added = false;
        if (!this.has(item)) {
            this.elements.push(item);
            added = true;
        }
        return added;
    }

    public delete(item: T): boolean {
        const index: number = this.find(item);
        if (index > -1) {
            this.elements.splice(index, 1);
        }
        return index > -1;
    }
}

export function findRole(guild: Guild, roleName: string): Role | undefined {
    return guild.roles.cache.find(r => r.name === roleName);
}