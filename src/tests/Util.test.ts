import { expect, assert } from  "chai";
import * as U from "../Util";
import * as R from "../commands/resetlead/ResetRoster"

describe("Util", function() {
  // getResetDay(week : number, year : number = new Date().getFullYear(), resetWeekDay : number = 5) : Date {
  // both months start at zero, so 2019-1-4 becomes 2019,0,4
  it("compare dates without time", () => 
    assert(U.compareDatesWithoutTime(new Date(Date.UTC(2019,1,1,23,59,59)), 
                                     new Date(Date.UTC(2019,1,1)))));

  it("reset date 2019-1-4", () => 
    assert(U.compareDatesWithoutTime(U.getResetDay(1, 2019, 5), 
                                     new Date(Date.UTC(2019,0,4))))); 

  it("reset date 2019-11-15", () => 
    assert(U.compareDatesWithoutTime(U.getResetDay(45, 2019, 5), 
                                     new Date(Date.UTC(2019,10,8))))); 

  it("upcoming reset before Friday", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,12))), 
                                     new Date(Date.UTC(2019,10,15)))));

  it("upcoming reset after Friday", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,10,16))), 
                                     new Date(Date.UTC(2019,10,22)))));

  it("upcoming reset between years", () => 
    assert(U.compareDatesWithoutTime(R.Roster.getNextResetDate(new Date(Date.UTC(2019,11,31))), 
                                     new Date(Date.UTC(2020,0,3)))));

  //it("reset date2", function() {
  //  expect(false).equal(false);
  //});
});
