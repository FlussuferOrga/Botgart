import { WeekdayNumbers } from "luxon";

export enum WvwRegion {
    EU = "EU",
    NA = "NA",
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace WvwRegion {
    export function getProperties(wvwRegion: WvwRegion) {
        let resetWeekDay: WeekdayNumbers;
        let resetHourUTC: number;
        switch (wvwRegion) {
            case WvwRegion.EU:
                resetWeekDay = 5;
                resetHourUTC = 18;
                break;
            case WvwRegion.NA:
                resetWeekDay = 6;
                resetHourUTC = 2;
                break;
            default:
                throw Error("Unmapped WvW Region");
        }
        return { resetWeekDay, resetHourUTC: resetHourUTC };
    }
}
