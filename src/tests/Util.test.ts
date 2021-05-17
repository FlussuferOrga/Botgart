import chai, { assert, expect } from "chai";
import chaiDateTime from "chai-datetime";
import moment from "moment";
import * as U from "../util/Util";
import "../util/string.extensions";

chai.use(chaiDateTime);


describe("Util - Date", () => {
    it("compare dates without time", () =>
        assert.isTrue(U.compareDatesWithoutTime(new Date(Date.UTC(2019, 1, 1, 23, 59, 59)),
            new Date(Date.UTC(2019, 1, 1)))));

    it("convert twice", () => {
        const orig = "2019-12-12T00:00:00.000+05:00";
        const mom: moment.Moment = U.isoStringToMoment(orig);
        return assert.equal(U.momentToIsoString(mom), orig);
    });

    it("convert twice with time", () => {
        const orig = "2019-12-12T12:15:51.000+03:00";
        const mom: moment.Moment = U.isoStringToMoment(orig);
        return assert.equal(U.momentToIsoString(mom), orig);
    });

    it("convert time excpects utc if unknown", () => {
        const orig = "2019-12-12T12:15:51.000";
        const mom: moment.Moment = U.isoStringToMoment(orig);
        return assert.equal(U.momentToIsoString(mom), "2019-12-12T12:15:51.000+00:00");
    });

    it("convert with Z", () => {
        const orig = "2019-12-12T12:15:51Z";
        const mom: moment.Moment = U.isoStringToMoment(orig);
        return assert.equal(U.momentToIsoString(mom), "2019-12-12T12:15:51.000+00:00");
    });


    // it("reset date2", function() {
    //  expect(false).equal(false);
    // });
});

describe("Util - WvW", () => {
    it("determine tier", () => {
        for (let i = 0; i < 100; i++) {
            const tier = U.determineTier(i);
            if (i >= 0 && i < 20) {
                expect(tier).equal(0);
            } else if (i >= 20 && i < 40) {
                expect(tier).equal(1);
            } else if (i >= 40 && i < 80) {
                expect(tier).equal(2);
            } else {
                expect(tier).equal(3);
            }
        }
    });
});

describe("Util - Is Between", () => {
    it("is between", () => expect(U.isBetweenTime(moment("2010-10-20 4:30", "YYYY-MM-DD HH:mm"), "23:00:00", "05:00:00")));

    it("is at start", () => expect(U.isBetweenTime(moment("2010-10-20 23:00", "YYYY-MM-DD HH:mm"), "23:00:00", "05:00:00")));

    it("is at end", () => expect(U.isBetweenTime(moment("2010-10-20 05:00", "YYYY-MM-DD HH:mm"), "23:00:00", "05:00:00")));

    it("rollover", () => expect(U.isBetweenTime(moment("2010-10-20 04:00", "YYYY-MM-DD HH:mm"), "23:00:00", "05:00:00")));

    it("is before", () => expect(!U.isBetweenTime(moment("2010-10-20 22:00", "YYYY-MM-DD HH:mm"), "23:00:00", "05:00:00")));

    it("is after", () => expect(!U.isBetweenTime(moment("2010-10-20 06:00", "YYYY-MM-DD HH:mm"), "23:00:00", "05:00:00")));
});


describe("Util - Crons", () => {
    it("empty string", () => expect(!U.parseCronDate("")));

    // it("undefined", () => expect(!Utils.parseCronDate(undefined)));

    it("cron valid string 1", () => expect(U.parseCronDate("0 * 32 * 3")).equal("0 * 32 * 3"));

    it("cron valid string 2", () => expect(U.parseCronDate("00 99 32 32 3")).equal("00 99 32 32 3"));

    it("cron valid string 3", () => expect(U.parseCronDate("* * * * *")).equal("* * * * *"));

    it("cron invalid string 1", () => assert(!U.parseCronDate("123 * * * *")));

    it("cron invalid string 2", () => assert(!U.parseCronDate("* * * * * *")));

    it("cron invalid string 3", () => assert(!U.parseCronDate("** * * * *")));

    it("cron valid Moment 1", () => assert(U.parseCronDate("12.12.2019 15:15").constructor.name === "Moment"));

    it("cron invalid Moment 1", () => assert(!U.parseCronDate("99.99.2019 15:15")));
});

describe("Util - Sets", () => {
    it("empty equal", () => assert(U.setEqual(new Set([]), new Set([]))));

    it("equal sets 1", () => assert(U.setEqual(new Set([1, 2]), new Set([1, 2]))));

    it("equal sets 2", () => assert(U.setEqual(new Set([1, 2, 2, 2, 2]), new Set([1, 2]))));

    it("equal sets 3", () => assert(U.setEqual(new Set([1, 2]), new Set([1, 2, 2, 2, 2]))));

    it("unequal sets", () => assert(!U.setEqual(new Set([1, 2]), new Set([3, 4]))));

    it("unequal sets unicode", () => assert(!U.setEqual(new Set(["⭐"]), new Set(["hello world"]))));

    it("equal sets unicode", () => assert(U.setEqual(new Set(["⭐"]), new Set(["⭐", "⭐"]))));

    it("overlapping sets", () => assert(!U.setEqual(new Set([1, 2]), new Set([2, 3]))));

    it("empty set", () => assert(U.setEqual(U.setMinus([1, 2, 3], new Set([])), new Set([1, 2, 3]))));

    it("empty list", () => assert(U.setEqual(U.setMinus([], new Set([1, 2, 3])), new Set([]))));

    it("empty both", () => assert(U.setEqual(U.setMinus([], new Set([])), new Set([]))));

    it("remove all", () => assert(U.setEqual(U.setMinus([1, 2], new Set([1, 2, 3])), new Set([]))));

    it("remove none", () => assert(U.setEqual(U.setMinus([1, 2, 3], new Set([4, 5])), new Set([1, 2, 3]))));

    it("remove some", () => assert(U.setEqual(U.setMinus([1, 2, 3, 4, 5], new Set([2, 5])), new Set([1, 3, 4]))));

    it("remove duplicates", () => assert(U.setEqual(U.setMinus([1, 2, 3, 1, 2, 3, 1, 2, 3], new Set([1, 2])), new Set([3, 3, 3]))));
});