import { assert, expect } from "chai";
import * as U from "../util/Util.js";

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
