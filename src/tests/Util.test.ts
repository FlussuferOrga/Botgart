import { expect, assert } from  "chai";
import * as U from "../Util";

console.log(U.getResetDay(1, 2019, 5));
console.log(new Date(2019,0,5));

describe("Util", function() {
  // getResetDay(week : number, year : number = new Date().getFullYear(), resetWeekDay : number = 5) : Date {
  // both months start at zero, so 2019-1-4 becomes 2019,0,4
  it("reset date 2019-1-4", () => assert(U.compareDatesWithoutTime(U.getResetDay(1, 2019, 5), new Date(2019,0,5)))); 

  it("reset date2", function() {
    expect(false).equal(false);
  });
});