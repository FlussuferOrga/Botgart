import { expect } from "chai";
import { Commander, CommanderStorage } from "../Commanders.js";

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

const dataFromTS3: { commanders: Commander[] } = {
    commanders: [
        new Commander(
            "Len.1879",
            "[RoE] Len",
            "111111",
            "Silas Kaffee-Raid 04:50AM till 6:00 AM",
            ["Events", "Silas Kaffee-Raid 04:50AM till 6:00 AM"],
            "https://invite.teamspeak.com/my-ts-server.example.com/?cid=17"
        ),
    ],
};
const dataFromTS3Empty: { commanders: Commander[] } = { commanders: [] };

describe("Commander Storage", () => {
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
        expect(singleStorage.getTaggedDown(new Set<string>(dataFromTS3.commanders.map((c) => c.getTS3ClientUID()))).length).equal(0);
    });

    it("Set minus received from TS3 2", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(dataFromTS3.commanders.map((c) => c.getTS3ClientUID()))).length).equal(2);
    });

    it("Set minus received from TS3 empty", () => {
        expect(filledStorage.getTaggedDown(new Set<string>(dataFromTS3Empty.commanders.map((c) => c.getTS3ClientUID()))).length).equal(3);
    });

    it("Set minus received from TS3 empty", () => {
        expect(emptyStorage.getTaggedDown(new Set<string>(dataFromTS3Empty.commanders.map((c) => c.getTS3ClientUID()))).length).equal(0);
    });
});
