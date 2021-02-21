export enum WvwRegion {
    EU = "EU",
    NA = "NA"
}

export namespace WvwRegion {
    export function getProperties(wvwRegion: WvwRegion) {
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
}