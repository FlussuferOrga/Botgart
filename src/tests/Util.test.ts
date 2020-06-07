import { assert, expect } from "chai";
import * as U from "../Util";
import * as R from "../commands/resetlead/ResetRoster"
import moment = require("moment");

describe("Util - Date", function() {
  // getResetDay(week : number, year : number = new Date().getFullYear(), resetWeekDay : number = 5) : Date {
  // both months start at zero, so 2019-1-4 becomes 2019,0,4
  it("number of week on Monday",    () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,11)))).equal(46));
  it("number of week on Tuesday",   () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,12)))).equal(46));
  it("number of week on Wednesday", () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,13)))).equal(46));
  it("number of week on Thursday",  () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,14)))).equal(46));
  it("number of week on Friday",    () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,15)))).equal(46));
  it("number of week on Saturday",  () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,16)))).equal(46));
  it("number of week on Sunday",    () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,17)))).equal(46));
  it("number of week on Saturday middle of day",  () => expect(U.getNumberOfWeek(new Date(Date.UTC(2019,10,16,13,53)))).equal(46));

  it("compare dates without time", () => 
    assert(U.compareDatesWithoutTime(new Date(Date.UTC(2019,1,1,23,59,59)), 
                                     new Date(Date.UTC(2019,1,1)))));

  it("reset date 2019-1-4", () => 
    assert(U.compareDatesWithoutTime(U.getResetDay(1, 2019, 5), 
                                     new Date(Date.UTC(2019,0,4))))); 

  it("reset date 2019-11-15", () => 
    assert(U.compareDatesWithoutTime(U.getResetDay(45, 2019, 5), 
                                     new Date(Date.UTC(2019,10,8))))); 

  it("reset date 2019-11-16", () =>
    assert(U.compareDatesWithoutTime(U.getResetDay(46, 2019, 5),
                                     new Date(Date.UTC(2019,10,15)))));

  it("reset date 2019-11-16", () =>
    assert(U.compareDatesWithoutTime(U.getResetDay(47, 2019, 5),
                                     new Date(Date.UTC(2019,10,22)))));

  it("convert twice", () => {
    const orig: string = "2019-12-12 00:00:00";
    const mom: moment.Moment = U.sqliteTimestampToMoment(orig);
    return assert(U.momentToLocalSqliteTimestamp(mom) == orig);
  });

  //it("reset date2", function() {
  //  expect(false).equal(false);
  //});
});

describe("Util - WvW", function() {
  it("upcoming reset before Friday", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,12))), 
                                     new Date(Date.UTC(2019,10,15)))));

  it("upcoming reset after Friday", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,16))), 
                                     new Date(Date.UTC(2019,10,22)))));

  it("upcoming reset between years", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,11,31))), 
                                     new Date(Date.UTC(2020,0,3)))));

  it("determine tier", () => {
    for(let i = 0; i < 100; i++) {
      const tier = U.determineTier(i);
      if(0 <= i && i < 20) {
        expect(tier).equal(0);
      } else if(20 <= i && i < 40) {
        expect(tier).equal(1);
      } else if(40 <= i && i < 80) {
        expect(tier).equal(2);
      } else {
        expect(tier).equal(3);
      }
    }
  });

  //it("upcoming reset on Saturday", () => 
  //  assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,16)))
  //                                   new Date(Date.UTC(2019,10,))

});

describe("Util - Is Between", function() {
  it("is between", () => expect(U.isBetweenTime(moment("2010-10-20 4:30", "YYYY-MM-DD HH:mm") , "23:00:00", "05:00:00")));

  it("is at start", () => expect(U.isBetweenTime(moment("2010-10-20 23:00", "YYYY-MM-DD HH:mm") , "23:00:00", "05:00:00")));

  it("is at end", () => expect(U.isBetweenTime(moment("2010-10-20 05:00", "YYYY-MM-DD HH:mm") , "23:00:00", "05:00:00")));

  it("rollover", () => expect(U.isBetweenTime(moment("2010-10-20 04:00", "YYYY-MM-DD HH:mm") , "23:00:00", "05:00:00")));

  it("is before", () => expect(!U.isBetweenTime(moment("2010-10-20 22:00", "YYYY-MM-DD HH:mm") , "23:00:00", "05:00:00")));

  it("is after", () => expect(!U.isBetweenTime(moment("2010-10-20 06:00", "YYYY-MM-DD HH:mm") , "23:00:00", "05:00:00")));
});


describe("Util - Crons", function() {
  it("empty string", () => expect(!U.parseCronDate("")));

  it("undefined", () => expect(!U.parseCronDate(undefined)));

  it("cron valid string 1", () => expect(U.parseCronDate("0 * 32 * 3")).equal("0 * 32 * 3"));

  it("cron valid string 2", () => expect(U.parseCronDate("00 99 32 32 3")).equal("00 99 32 32 3"));

  it("cron valid string 3", () => expect(U.parseCronDate("* * * * *")).equal("* * * * *"));

  it("cron invalid string 1", () => assert(!U.parseCronDate("123 * * * *")));

  it("cron invalid string 2", () => assert(!U.parseCronDate("* * * * * *")));

  it("cron invalid string 3", () => assert(!U.parseCronDate("** * * * *")));
  
  it("cron valid Moment 1", () => assert(U.parseCronDate("12.12.2019 15:15").constructor.name === "Moment"));

  it("cron invalid Moment 1", () => assert(!U.parseCronDate("99.99.2019 15:15")));

});

describe("Util - Sets", function() {
  it("empty equal", () => assert(U.setEqual(new Set([]), new Set([]))));

  it("equal sets 1", () => assert(U.setEqual(new Set([1,2]), new Set([1,2]))));

  it("equal sets 2", () => assert(U.setEqual(new Set([1,2,2,2,2]), new Set([1,2]))));

  it("equal sets 3", () => assert(U.setEqual(new Set([1,2]), new Set([1,2,2,2,2]))));

  it("unequal sets", () => assert(!U.setEqual(new Set([1,2]), new Set([3,4]))));

  it("unequal sets unicode", () => assert(!U.setEqual(new Set(['⭐']), new Set(['hello world']))));

  it("equal sets unicode", () => assert(U.setEqual(new Set(['⭐']), new Set(['⭐','⭐']))));

  it("overlapping sets", () => assert(!U.setEqual(new Set([1,2]), new Set([2,3]))));

  it("empty set",   () => assert(U.setEqual(U.setMinus([1,2,3],new Set([])), new Set([1,2,3]))));

  it("empty list",  () => assert(U.setEqual(U.setMinus([],new Set([1,2,3])), new Set([]))));

  it("empty both",  () => assert(U.setEqual(U.setMinus([],new Set([])), new Set([]))));

  it("remove all",  () => assert(U.setEqual(U.setMinus([1,2],new Set([1,2,3])), new Set([]))));

  it("remove none", () => assert(U.setEqual(U.setMinus([1,2,3],new Set([4,5])), new Set([1,2,3]))));

  it("remove some", () => assert(U.setEqual(U.setMinus([1,2,3,4,5],new Set([2,5])), new Set([1,3,4]))));

  it("remove duplicates", () => assert(U.setEqual(U.setMinus([1,2,3,1,2,3,1,2,3],new Set([1,2])), new Set([3,3,3]))));
});