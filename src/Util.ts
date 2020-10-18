import callsites from "callsites";
import * as discord from "discord.js";

import glob from "glob" // dynamic module loading
import path from "path" // ^
import * as winston from "winston";
import moment = require("moment");

export const RESET_WEEKDAY: number = 5; // FRIDAY

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
              : word.charAt(0).toUpperCase() + word.slice(1)
}

export function determineTier(yaksDelivered: number) {
    const yd = Math.floor(yaksDelivered/10);
    return yd < 1 ? 0 : Math.min(3, Math.floor(Math.log2(yd)));
}

/**
* Cheating instanceof(x,c)
* When loading classes with loadDirectoryModuleClasses, 
* the instanceof fails since upgrading Node. 
* So this low-effort but also kinda dangerous method 
* (only checks for name, no namespace checking or anything!)
* serves as a replacement, especially when loading the Achievements. 
* @param x: the object to check the class of. 
* @param c: the class of which x should be an instance of (subclasses are allowed). 
* @returns true, if c is somewhere in the inheritance chain of x.
*/
export function isa(x: any, c: any) { 
  let is = false;
  let cls = Object.getPrototypeOf(x);
  do {
    is = cls.constructor.name == c.name;
    cls = Object.getPrototypeOf(cls);    
  } while(!is && cls != null);
  return is;
}

export function loadDirectoryModuleClasses(directory: string, args: any[] = [], blacklist: string[] = []): object[] {
    // careful! Skips variables, but WILL instantiate non-class-functions! 
    return glob.sync(directory).map(file => loadModuleClasses(file, args, blacklist)).reduce((acc, cls) => acc.concat(cls), []);
}

export function loadModuleClasses(file: string, args: any[] = [], blacklist: string[] = []): object[] {
    const loadedClasses: object[] = [];
    const module = require(path.resolve(file));
    for(const exportName in module) {
        if(!blacklist.includes(exportName)) {
            try {
                loadedClasses.push(new module[exportName](...args));
            } catch(e) {
                if(!(e instanceof TypeError)) {
                    throw e; // discard failed instantiations of functions and variables, throw everything else
                }
            }
        }         
    }
    return loadedClasses;
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
export function parseCronDate(input: string, dateFomat: string = "DD.MM.YYYY H:m"): string | moment.Moment | boolean {
    if(input === "") { // empty strings are "valid dates"
        return false;
    }
    let res : string | moment.Moment | boolean = moment(input, dateFomat, true);
    if(!res.isValid()) {
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
           && d1.getUTCFullYear() == d2.getUTCFullYear()
}

/**
* Creates a standard UTC day without the time components.
* This can be relevant when adding to a day during computations
* can lead to confusing results when it's the middle of the day.
* -> 2019-12-24 13:00 -> 2019-12-24 00:00 
* d: the Date to normalise
* returns: the passed day with the time components set to 0
*/
export function getStandardDay(d: Date) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
* Determines the reset day for a certain week.
* week: the week to calculate the reset day for 
* year: the year the week lied in. Per default it is the current year, but take care around New Year!
* resetWeekDay: day of week the reset takes place: SUN 0, MON 1, TUE 2, WED 3, THU 4, FRI 5, SAT 6; per default it is Friday
* returns: the Date on which the reset of the specified week takes place.
*/
export function getResetDay(week : number, year : number = new Date().getFullYear(), resetWeekDay : number = 5) : Date {
  // look for the first reset day of the year
  let resetDay : Date = new Date(Date.UTC(year, 0, 1));
  while(resetDay.getDay() != resetWeekDay) {
    resetDay.setDate(resetDay.getDate() + 1);
  }
  const firstResetWeekNumber : number = getNumberOfWeek(resetDay); // if the first day of the year is either SAT or SUN, the first Friday of the year is in week 2! So check that.
  resetDay.setDate(resetDay.getDate() + (7 * (week - firstResetWeekNumber)));
  return resetDay;
}

// blatantly stolen from https://gist.github.com/IamSilviu/5899269#gistcomment-2918013
export function getNumberOfWeek(today: Date = new Date()) {
    today = getStandardDay(today);
    if(today.getDay() === 0) {
        // since JS weeks start on Sundays, we calculate the week for Saturday
        // if we would calculate the week for a Sunday.
        today.setDate(today.getDate() - 1);
    }
    const firstDayOfYear = new Date(Date.UTC(today.getFullYear(), 0, 1));
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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


/**
* Assigns a role to user if needed. This method can be used for either assigning
* roles to new users or assigning them new, mutual exclusive ones:
* assignServerRole(u, A, null): u currently has role A, but should have no role (left server)
* assignServerRole(u, null, A): u currently has no role, but should have role A (new user)
* assignServerRole(u, A, B): u currently has role A, but should have role B (changed server to another admitted server)
* assignServerRole(u, A, A): u already has the role they should have. This is just proper revalidation and will do nothing.
*
* @param {GuildMember} member - the member to assign a server role to.
* @param {Role|null} currentRole - the role the member was assigned last.
* @param {Role|null} admittedRole - the role the member should actually have.
* @returns {Role|null} - the role the member is now assigned.
*/
export function assignServerRole(member: discord.GuildMember, currentRole: discord.Role | null, admittedRole: discord.Role | null) : discord.Role | null {
    // FIXME: the asynchronous erroring could leave the user in an undefined state, where the system
    // assumes him to now have role A, but in fact assigning him role A has failed!

    if(currentRole !== null && admittedRole !== null && currentRole.name === admittedRole.name) {
        // member already has proper role
        return admittedRole;
    }

    if(currentRole !== null) {
        // remove currentRole
        member.roles.remove(currentRole).then(
            ()    => log("info", `Removed role ${currentRole.name} from user ${member.displayName}`),
            (err) => log("error", `Error while removing role ${currentRole.name} from user ${member.displayName}: ${err.message}.`)
        );
    }

    if(admittedRole !== null) {
        // assign admittedRole
        member.roles.add(admittedRole).then(
            ()    => log("info", `Gave role ${admittedRole.name} to user ${member.displayName}.`),
            (err) => log("error", "Error while giving role ${admittedRole.name} to user ${member.displayName}: ${err.message}.")
        );
    }
    return admittedRole;
};


export function resolveDiscordUser(client: discord.Client, uid: string): discord.GuildMember | undefined {
    let user: discord.GuildMember | undefined = undefined;
    let i = 0;
    const gs = client.guilds.cache.array();
    let l = gs.length; // discord.Collection actually provides a find(any -> boolean)-function, but I can't be arsed.
    
    while(!user && i < l) {
        user = gs[i].members.cache.find(m => m.user.id === uid);
        i++;
    }
    return user;
}

export function assertType(obj:any, t:string): void {
    let p = obj;
    while(p && p.constructor.name !== t) {
        p = p.__proto__;
    }
    // if we walked the inheritence up and obj IS a t, then  we must have stopped before we hit NULL.
    // -> p being null implies that obj IS NOT a t.
    //assert(p != null, "Expected object to be of type {0}, but it is of type {1}.".formatUnicorn(t, obj ? obj.constructor.name : obj));
}

export const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.simple(),
    winston.format.printf(({ level, label, message, timestamp }) => {
        return `${timestamp} ${level} [${label}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'log/bot_combined.log',
      level: 'info'
    }),
    new winston.transports.File({
      filename: 'log/bot_errors.log',
      level: 'error'
    }),
    new winston.transports.File({
        filename: '/tmp/botgart_debug.log',
        level: 'debug'
    })
  ]
});
export function log(level: string, message: string): winston.Logger {
    const callFile: string[] = callsites()[1].getFileName()?.split(path.sep) ?? ["UNKNOWN"];
    const file = callFile[callFile.length - 1];
    return logger.log({
        "label": file, // label,
        "level": level,
        "message": message
    });
}

declare global {
    interface String {
        formatUnicorn(...fnargs: any[]) : string;
    }
}

// taken from https://stackoverflow.com/a/18234317
String.prototype.formatUnicorn = function (...fnargs: any[]): string {
    var str = this.toString();
    if (fnargs.length) {
        var t = typeof fnargs[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(fnargs)
            : fnargs[0];
        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }
    return str;
};

export function getNextResetDate(now = new Date()): Date {
    const resetDay = getResetDay(getNumberOfWeek(now), now.getFullYear());
    const nowWeekDay = (now.getDay() + 6)%7; // makes SUN 6
    const resetWeekDay = (RESET_WEEKDAY + 6)%7;
    if(nowWeekDay > resetWeekDay) {
        resetDay.setDate(resetDay.getDate() + 7);
    }
    return resetDay;
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
        let i: number = 0;
        while(i < this.elements.length && !this.elements[i].equals(item)) {
            i++;
        }
        return i < this.elements.length ? i : -1;
    }

    public has(item: T): boolean {
        return this.find(item) > -1;
    }

    public add(item: T): boolean {
        let added: boolean = false;
        if(!this.has(item)) {
            this.elements.push(item);
            added = true;
        }
        return added;
    }

    public delete(item: T): boolean {
        const index: number = this.find(item);
        if(index > -1) {
            this.elements.splice(index, 1);
        }
        return index > -1;
    }
}