import { expect } from "chai";
import * as ts3 from "../TS3Connection";


const c1: ts3.Commander = new ts3.Commander("Len.1879", "[RoE] Len", "111111", "Öffentlicher Raid [DE]");
const c2: ts3.Commander = new ts3.Commander("Jey.1879", "[RoE] Jey", "222222", "Internal Raid [EN]");
const c3: ts3.Commander = new ts3.Commander("Dr Eisenfaust.1111", "⭐ Dr. Eisenfaust ⭐", "333333", "⭐ Event");

const emptyStorage: ts3.CommanderStorage = new ts3.CommanderStorage();
const singleStorage: ts3.CommanderStorage = new ts3.CommanderStorage();
const filledStorage: ts3.CommanderStorage = new ts3.CommanderStorage();
singleStorage.addCommander(c1);
filledStorage.addCommander(c1);
filledStorage.addCommander(c2);
filledStorage.addCommander(c3);


const dataFromTS3: {"commanders": ts3.TS3Commander[]} = {"commanders":[{"account_name":"Len.1879","ts_cluid":"111111","ts_display_name":"[RoE] Len","ts_channel_name":"Silas Kaffee-Raid 04:50AM till 6:00 AM"}]};
const dataFromTS3Empty: {"commanders": ts3.TS3Commander[]} = {"commanders":[]};


describe("TS3Connection", function() {
  it("Set minus empty - {}", () => {
    expect(emptyStorage.setMinus(new Set<string>())).deep.equal([]);
  });

  it("Set minus empty - {111111,222222}", () => {
    expect(emptyStorage.setMinus(new Set<string>(["111111","222222"]))).deep.equal([]);
  });

  it("Set minus single - {}", () => {
    expect(singleStorage.setMinus(new Set<string>()).length).equal(1);
  });

  it("Set minus single - {111111,222222}", () => {
    expect(singleStorage.setMinus(new Set<string>(["111111","222222"])).length).equal(0);
  });

  it("Set minus single - {222222}", () => {
    expect(singleStorage.setMinus(new Set<string>(["222222"])).length).equal(1);
  });

  it("Set minus filled - {222222}", () => {
    expect(filledStorage.setMinus(new Set<string>(["222222"])).length).equal(2);
  });

  it("Set minus filled - {111111, 222222}", () => {
    expect(filledStorage.setMinus(new Set<string>(["111111","222222"])).length).equal(1);
  });

  it("Set minus filled - {111111, 222222}", () => {
    expect(filledStorage.setMinus(new Set<string>(["111111","222222"])).length).equal(1);
  });

  it("Set minus received from TS3 1", () => {
    expect(singleStorage.setMinus(new Set<string>(dataFromTS3.commanders.map(c => c.ts_cluid))).length).equal(0);
  });

  it("Set minus received from TS3 2", () => {
    expect(filledStorage.setMinus(new Set<string>(dataFromTS3.commanders.map(c => c.ts_cluid))).length).equal(2);
  });

  it("Set minus received from TS3 empty", () => {
    expect(filledStorage.setMinus(new Set<string>(dataFromTS3Empty.commanders.map(c => c.ts_cluid))).length).equal(3);
  });

  it("Set minus received from TS3 empty", () => {
    expect(emptyStorage.setMinus(new Set<string>(dataFromTS3Empty.commanders.map(c => c.ts_cluid))).length).equal(0);
  });
});
