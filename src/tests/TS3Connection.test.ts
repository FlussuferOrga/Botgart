import { expect } from "chai";
import * as ts3 from "../TS3Connection";
import { Commander, CommanderStorage } from "../Commanders";

const c1: Commander = new Commander("Len.1879", "[RoE] Len", "111111", "Öffentlicher Raid [DE]", ["Öffentlicher Raid [DE]"], "");
const c2: Commander = new Commander("Jey.1879", "[RoE] Jey", "222222", "Internal Raid [EN]", ["Internal Raid [EN]"], "");
const c3: Commander = new Commander("Dr Eisenfaust.1111", "⭐ Dr. Eisenfaust ⭐", "333333", "⭐ Event", ["Events", "⭐ Event"], "");

const emptyStorage: CommanderStorage = new CommanderStorage();
const singleStorage: CommanderStorage = new CommanderStorage();
const filledStorage: CommanderStorage = new CommanderStorage();
singleStorage.addCommander(c1);
filledStorage.addCommander(c1);
filledStorage.addCommander(c2);
filledStorage.addCommander(c3);

const dataFromTS3: { commanders: ts3.TS3Commander[] } = {
    commanders: [
        {
            account_name: "Len.1879",
            ts_cluid: "111111",
            ts_display_name: "[RoE] Len",
            ts_channel_path: ["Events", "Silas Kaffee-Raid 04:50AM till 6:00 AM"],
            ts_channel_name: "Silas Kaffee-Raid 04:50AM till 6:00 AM",
            ts_join_url: "https://invite.teamspeak.com/my-ts-server.example.com/?cid=17",
        },
    ],
};
const dataFromTS3Empty: { commanders: ts3.TS3Commander[] } = { commanders: [] };

describe("TS3Connection", () => {
    it("Set minus empty - {}", () => {
        expect(emptyStorage.getTaggedDown(new Set<string>())).deep.equal([]);
    });

    it("Set minus empty - {111111,222222}", () => {
        expect(emptyStorage.getTaggedDown(new Set<string>(["111111", "222222"]))).deep.equal([]);
    });

    it("Set minus single - {}", () => {
        expect(singleStorage.getTaggedDown(new Set<string>()).length).equal(1);
    });

    it("Set minus single - {111111,222222}", () => {
        expect(singleStorage.getTaggedDown(new Set<string>(["111111", "222222"])).length).equal(0);
    });

    it("Set minus single - {222222}", () => {
        expect(singleStorage.getTaggedDown(new Set<string>(["222222"])).length).equal(1);
    });

    it("Set minus filled - {222222}", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(["222222"])).length).equal(2);
    });

    it("Set minus filled - {111111, 222222}", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(["111111", "222222"])).length).equal(1);
    });

    it("Set minus filled - {111111, 222222}", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(["111111", "222222"])).length).equal(1);
    });

    it("Set minus received from TS3 1", () => {
        expect(singleStorage.getTaggedDown(new Set<string>(dataFromTS3.commanders.map((c) => c.ts_cluid))).length).equal(0);
    });

    it("Set minus received from TS3 2", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(dataFromTS3.commanders.map((c) => c.ts_cluid))).length).equal(2);
    });

    it("Set minus received from TS3 empty", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(dataFromTS3Empty.commanders.map((c) => c.ts_cluid))).length).equal(3);
    });

    it("Set minus received from TS3 empty", () => {
        expect(emptyStorage.getTaggedDown(new Set<string>(dataFromTS3Empty.commanders.map((c) => c.ts_cluid))).length).equal(0);
    });
});
