import moment, { Moment } from "moment-timezone";

export enum WvwRegion {
    EU = "EU",
    NA = "NA"
}

function getWvwRegionProperties(wvwRegion: WvwRegion) {
    let resetWeekDay: number;
    let resetTimeUTC: number;
    switch (wvwRegion) {
        case WvwRegion.EU:
            resetWeekDay = 5;
            resetTimeUTC = 18;
            break
        case WvwRegion.NA:
            resetWeekDay = 6
            resetTimeUTC = 2
            break
        default:
            throw Error("Unmapped WvW Region")
    }
    return {resetWeekDay, resetTimeUTC};
}

export function currentWeek(): number {
    return moment().utc().isoWeek()
}

export function getResetForWeek(isoWeek = moment().isoWeek(), year = moment().year(), wvwRegion: WvwRegion = WvwRegion.EU): Moment {
    let {resetWeekDay, resetTimeUTC} = getWvwRegionProperties(wvwRegion)
    return moment().tz("UTC")
        .year(year)
        .isoWeek(isoWeek)
        .isoWeekday(resetWeekDay)
        .hour(resetTimeUTC)
        .startOf("hour")
}

export function getNextResetDateMoment(startingPoint = moment(), wvwRegion: WvwRegion = WvwRegion.EU): Moment {
    let _startingPoint = startingPoint.clone().tz("UTC")
    let {resetWeekDay, resetTimeUTC} = getWvwRegionProperties(wvwRegion)

    let nextResetMoment;
    if (_startingPoint.isoWeekday() < resetWeekDay) {
        // next reset is somewhere this week
        nextResetMoment = _startingPoint.isoWeekday(resetWeekDay);
    } else if (_startingPoint.isoWeekday() > resetWeekDay) {
        // reset already happened this week
        nextResetMoment = _startingPoint.add(1, 'weeks').isoWeekday(resetWeekDay);
    } else if (_startingPoint.isoWeekday() == resetWeekDay) {
        // reset day is today
        if (_startingPoint.hour() >= resetTimeUTC) {
            // reset is happening or happened today
            nextResetMoment = _startingPoint.add(1, 'weeks').isoWeekday(resetWeekDay);
        } else {
            nextResetMoment = _startingPoint //starting point IS reset day but before reset time
        }
    }
    // reset time
    nextResetMoment = nextResetMoment.hour(resetTimeUTC).startOf('hour')
    return nextResetMoment;
}