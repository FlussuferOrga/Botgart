import { assert } from "chai";
import * as ResetUtils from "../commands/resetlead/ResetUtil.js";
import { WvwRegion } from "../commands/resetlead/WvwRegion.js";
import { DateTime } from "luxon";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Chai {
        interface AssertStatic {
            sameExactDateTime(val: DateTime, exp: DateTime, msg?: string): void;

            samePointInTime(val: DateTime, exp: DateTime, msg?: string): void;
        }
    }
}
assert["sameExactDateTime"] = function (actual: DateTime, expected: DateTime) {
    assert.equal(actual.toISO(), expected.toISO()); // this also checks the stored timezone to be equal
};

assert["samePointInTime"] = function (actual: DateTime, expected: DateTime) {
    this.equal(actual.toUTC().toISO(), expected.toUTC().toISO()); // this also checks the stored timezone to be equal
};

describe("ResetUtil", () => {
    it("upcoming reset before Friday (EU)", () => {
        assert.sameExactDateTime(ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 12)), DateTime.utc(2019, 11, 15, 18));
    });

    it("upcoming reset before Friday (EU) Moment", () => {
        const actual = ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 12));
        const expected = DateTime.utc(2019, 11, 15, 18);
        assert.sameExactDateTime(actual, expected);
    });

    it("upcoming reset before at Friday (EU) Moment", () => {
        const actual = ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 15));
        const expected = DateTime.utc(2019, 11, 15, 18);
        assert.sameExactDateTime(actual, expected);
    });

    it("upcoming reset before at Friday right before reset (EU) Moment", () => {
        const actual = ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 15, 17, 55, 0));
        const expected = DateTime.utc(2019, 11, 15, 18);
        assert.sameExactDateTime(actual, expected);
    });

    it("upcoming reset at Friday right on reset (EU) Moment", () => {
        const actual = ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 15, 18));
        const expected = DateTime.utc(2019, 11, 22, 18); // expecting next
        assert.sameExactDateTime(actual, expected);
    });
    it("upcoming reset before at Friday right after reset (EU) Moment", () => {
        const actual = ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 15, 18, 0, 1));
        const expected = DateTime.utc(2019, 11, 22, 18);
        assert.sameExactDateTime(actual, expected);
    });

    it("upcoming reset before Friday (NA)", () =>
        assert.sameExactDateTime(ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 12), WvwRegion.NA), DateTime.utc(2019, 11, 16, 2)));

    it("upcoming reset after Friday", () =>
        assert.sameExactDateTime(ResetUtils.getNextResetDateTime(DateTime.utc(2019, 11, 16)), DateTime.utc(2019, 11, 22, 18)));

    it("upcoming reset after Friday (Summertime)", () => {
        assert.samePointInTime(
            ResetUtils.getNextResetDateTime(DateTime.fromISO("2019-08-16", { zone: "utc" })),
            DateTime.local(2019, 8, 16, 20, { zone: "Europe/Berlin" })
        );
    });

    it("upcoming reset after reset on friday Friday (Summertime Input)", () => {
        assert.samePointInTime(
            ResetUtils.getNextResetDateTime(DateTime.local(2019, 8, 16, 20, 1, 0, { zone: "Europe/Berlin" })),
            DateTime.local(2019, 8, 23, 20, { zone: "Europe/Berlin" })
        );
    });

    it("upcoming reset between years", () =>
        assert.sameExactDateTime(ResetUtils.getNextResetDateTime(DateTime.utc(2019, 12, 31)), DateTime.utc(2020, 1, 3, 18)));

    it("Get Reset by week and year returns first reset in year", () =>
        assert.sameExactDateTime(ResetUtils.getResetForWeek(7, 2021), DateTime.utc(2021, 2, 19, 18)));

    it("Get Reset by week and year returns first reset in yea 2r", () =>
        assert.sameExactDateTime(ResetUtils.getResetForWeek(8, 2021), DateTime.utc(2021, 2, 26, 18)));

    it("No duplicate reset dates", () => {
        let now = DateTime.now();

        // generate the next 400 Reset Dates
        const resets: string[] = [];
        for (let i = 0; i < 20; i++) {
            resets.push(ResetUtils.getNextResetDateTime(now).toISO()!);
            now = now.plus({ week: 1 });
        }

        // Make sure there are no duplicates
        const distinct = [...new Set(resets)];
        assert.sameMembers(distinct, resets);
    });
});
