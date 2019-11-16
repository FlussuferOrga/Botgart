import { expect, assert } from  "chai";
import * as U from "../Util";
import * as R from "../commands/resetlead/ResetRoster"

describe("Util", function() {
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

  //it("reset date2", function() {
  //  expect(false).equal(false);
  //});
});

describe("Util", function() {
  it("upcoming reset before Friday", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,12))), 
                                     new Date(Date.UTC(2019,10,15)))));

  it("upcoming reset after Friday", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,16))), 
                                     new Date(Date.UTC(2019,10,22)))));

  it("upcoming reset between years", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,11,31))), 
                                     new Date(Date.UTC(2020,0,3)))));

  //it("upcoming reset on Saturday", () => 
  //  assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,16)))
  //                                   new Date(Date.UTC(2019,10,))

});
