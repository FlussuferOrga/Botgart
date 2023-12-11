import { WvwRegion } from "./WvwRegion.js";
import { DateTime } from "luxon";

export function currentWeek(): number {
    return DateTime.utc().weekNumber;
}

export function currentYear(): number {
    return DateTime.utc().weekYear;
}

export function getResetForWeek(isoWeek = DateTime.utc().weekNumber, year = DateTime.utc().weekYear, wvwRegion: WvwRegion = WvwRegion.EU): DateTime {
    const { resetWeekDay, resetHourUTC } = WvwRegion.getProperties(wvwRegion);
    return DateTime.utc().set({ weekYear: year, weekNumber: isoWeek, weekday: resetWeekDay, hour: resetHourUTC }).startOf("hour");
}

export function getNextResetDateTime(startingPoint: DateTime = DateTime.utc(), wvwRegion: WvwRegion = WvwRegion.EU): DateTime {
    const _startingPoint = startingPoint!.toUTC();
    const { resetWeekDay, resetHourUTC } = WvwRegion.getProperties(wvwRegion);

    let nextReset: DateTime | undefined;
    if (_startingPoint.get("weekday") < resetWeekDay) {
        // next reset is somewhere this week
        nextReset = _startingPoint.set({ weekday: resetWeekDay });
    } else if (_startingPoint.get("weekday") > resetWeekDay) {
        // reset already happened this week
        nextReset = _startingPoint.plus({ week: 1 }).set({ weekday: resetWeekDay });
    } else if (_startingPoint.get("weekday") == resetWeekDay) {
        // reset day is today
        if (_startingPoint.get("hour") >= resetHourUTC) {
            // reset is happening or happened today
            nextReset = _startingPoint.plus({ week: 1 }).set({ weekday: resetWeekDay });
        } else {
            nextReset = _startingPoint; // starting point IS reset day but before reset time
        }
    }
    // reset time
    nextReset = nextReset!.set({ hour: resetHourUTC }).startOf("hour");
    return nextReset;
}
