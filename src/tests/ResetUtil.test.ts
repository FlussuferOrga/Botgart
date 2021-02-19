import chai, { assert } from "chai";
import chaiDateTime from "chai-datetime";
import chaiMoment from "chai-moment";
import moment from "moment";
import { Moment } from "moment-timezone";
import * as Utils from "../commands/resetlead/ResetUtil";
import { WvwRegion } from "../Util";

chai.use(chaiDateTime);
chai.use(chaiMoment);

declare global {
    namespace Chai {
        interface AssertStatic {
            exactMoment(val: Moment, exp: Moment, msg?: string): void;
        }
    }
}
assert["exactMoment"] = function (actual: any, expected: any) {
    this.sameMoment(actual, expected)
    this.equal(actual.format(), expected.format()) //this also checks the stored timezone to be equal
}

describe("ResetUtil", function () {


    it("upcoming reset before Friday (EU)", () => {
        assert.exactMoment(
            Utils.getNextResetDateMoment(moment.tz("2019-11-12", "UTC")),
            moment.tz("2019-11-15 18:00:00", "UTC")
        );
    });

    it("upcoming reset before Friday (EU) Moment", () => {
        const actual = Utils.getNextResetDateMoment(moment.tz("2019-11-12", "UTC"));
        const expected = moment.tz("2019-11-15 18:00:00", "UTC")
        assert.exactMoment(actual, expected);
    });

    it("upcoming reset before at Friday (EU) Moment", () => {
        const actual = Utils.getNextResetDateMoment(moment.tz("2019-11-15", "UTC"));
        const expected = moment.tz("2019-11-15 18:00:00", "UTC")
        assert.exactMoment(actual, expected);
    });

    it("upcoming reset before at Friday right before reset (EU) Moment", () => {
        const actual = Utils.getNextResetDateMoment(moment.tz("2019-11-15 17:55:00", "UTC"));
        const expected = moment.tz("2019-11-15 18:00:00", "UTC")
        assert.exactMoment(actual, expected);
    });

    it("upcoming reset at Friday right on reset (EU) Moment", () => {
        const actual = Utils.getNextResetDateMoment(moment.tz("2019-11-15 18:00:00", "UTC"));
        const expected = moment.tz("2019-11-22 18:00:00", "UTC") //expecting next
        assert.exactMoment(actual, expected);
    });
    it("upcoming reset before at Friday right after reset (EU) Moment", () => {
        const actual = Utils.getNextResetDateMoment(moment.tz("2019-11-15 18:00:01", "UTC"));
        const expected = moment.tz("2019-11-22 18:00:00", "UTC")
        assert.exactMoment(actual, expected);
    });

    it("upcoming reset before Friday (NA)", () =>
        assert.exactMoment(Utils.getNextResetDateMoment(moment.tz("2019-11-12", "UTC"), WvwRegion.NA),
            moment.tz("2019-11-16 02:00:00", "UTC")));

    it("upcoming reset after Friday", () =>
        assert.exactMoment(Utils.getNextResetDateMoment(moment.tz("2019-11-16", "UTC")),
            moment.tz("2019-11-22 18:00:00", "UTC")));

    it("upcoming reset after Friday (Summertime)", () => {
        assert.sameMoment(
            Utils.getNextResetDateMoment(moment.utc("2019-08-16")),
            moment.tz("2019-08-16 20:00", "Europe/Berlin"));
    });

    it("upcoming reset after reset on friday Friday (Summertime Input)", () => {
        assert.sameMoment(
            Utils.getNextResetDateMoment(moment.tz("2019-08-16 20:01:00", "Europe/Berlin")),
            moment.tz("2019-08-23 20:00", "Europe/Berlin"));
    });

    it("upcoming reset between years", () =>
        assert.exactMoment(Utils.getNextResetDateMoment(moment.tz("2019-12-31", "UTC")),
            moment.tz("2020-01-03 18:00:00", "UTC"))
    );

    it("Get Reset by week and year returns first reset in year", () =>
        assert.exactMoment(Utils.getResetForWeek(1, 2021), moment.tz("2020-01-03 18:00:00", "UTC"))
    );

    it("No duplicate reset dates", () => {
            let now = moment();

            //generate the next 400 Reset Dates
            let resets: string[] = []
            for (let i = 0; i < 20; i++) {
                resets.push(Utils.getNextResetDateMoment(now).format())
                now = now.add(1, "week")
            }

            //Make sure there are no duplicates
            const distinct = [...new Set(resets)];
            assert.sameMembers(distinct, resets)
        }
    );

});