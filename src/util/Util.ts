import { Guild, Role, verifyString } from "discord.js";
import "./string.extensions.js";

export const RESET_WEEKDAY = 5; // FRIDAY

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
    return word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
}

export function determineTier(yaksDelivered: number) {
    const yd = Math.floor(yaksDelivered / 10);
    return yd < 1 ? 0 : Math.min(3, Math.floor(Math.log2(yd)));
}

export function formatUserPing(uid: string) {
    return "<@{0}>".formatUnicorn(uid);
}

export async function asyncForEach<T>(array: T[], callback: (item: T, index?: number, array?: T[]) => Promise<unknown>): Promise<void> {
    for (let i = 0; i < array.length; i++) {
        await callback(array[i], i, array);
    }
}

export function setEqual<T>(s1: Set<T>, s2: Set<T>): boolean {
    // https://stackoverflow.com/a/44827922
    return s1.size === s2.size && [...s1].every((value) => s2.has(value));
}

export function setMinus<T>(s1: Iterable<T>, s2: Set<T>): Set<T> {
    return new Set(Array.from(s1).filter((x) => !s2.has(x)));
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
    return guild.roles.cache.find((r) => r.name === roleName);
}

export type SplitOptions = {
    maxLength?: number;
    char?: string | string[] | RegExp | RegExp[];
    prepend?: string;
    append?: string;
};

/**
 * Splits a string into multiple chunks at a designated character that do not exceed a specific length.
 * @param {string} text Content to split
 * @param {SplitOptions} [options] Options controlling the behavior of the split
 * @returns {string[]}
 */
export function splitMessage(text: string, { maxLength = 2_000, char = "\n", prepend = "", append = "" }: SplitOptions = {}) {
    // eslint-disable-next-line no-param-reassign
    text = verifyString(text);
    if (text.length <= maxLength) return [text];
    let splitText = [text];
    if (Array.isArray(char)) {
        while (char.length > 0 && splitText.some((elem) => elem.length > maxLength)) {
            const currentChar = char.shift();
            if (currentChar instanceof RegExp) {
                splitText = splitText.flatMap((chunk) => chunk.match(currentChar) || []);
            } else if (currentChar !== undefined) {
                splitText = splitText.flatMap((chunk) => chunk.split(currentChar));
            }
        }
    } else {
        splitText = text.split(char);
    }
    if (splitText.some((elem) => elem.length > maxLength)) throw new RangeError("SPLIT_MAX_LEN");
    const messages: string[] = [];
    let msg = "";
    for (const chunk of splitText) {
        if (msg && (msg + char + chunk + append).length > maxLength) {
            messages.push(msg + append);
            msg = prepend;
        }
        msg += (msg && msg !== prepend ? char : "") + chunk;
    }
    return messages.concat(msg).filter((m) => m);
}
