import { expect } from "chai";
import fs from "fs";
import * as DB from "../DB";
import { Database, initialize } from "../DB";
import { DatabasePatcher } from "../patches/DatabasePatcher";
import { allPatches } from "../patches/PatchRegistry";

describe("DB", function () {
    const testGuild = "00000";
    const databaseFilePath = "./db/test-database.db";

    let db: Database;

    before('setupDatabase', function (done) {
        db = initialize(databaseFilePath);
        done()
    });
    before('patchDatabase', async function () {
        await new DatabasePatcher(db).applyPatches(allPatches, false)
    });

    after("cleanup", function (done) {
        fs.unlink(databaseFilePath, done)
    })

    it("write environment implicitly typed boolean to DB", () => {
        db._setEnvironmentVariable(testGuild, "testBoolean1", true);
        expect(db._getEnvironmentVariable(testGuild, "testBoolean1"))
            .deep.equal(["true", "boolean", true]);
    });

    it("write environment explicitly typed boolean to DB", () => {
        db._setEnvironmentVariable(testGuild, "testBoolean2", "true", "boolean");
        expect(db._getEnvironmentVariable(testGuild, "testBoolean2"))
            .deep.equal(["true", "boolean", true]);
    });

    it("write environment implicitly typed integer to DB", () => {
        db._setEnvironmentVariable(testGuild, "testInteger1", 42);
        expect(db._getEnvironmentVariable(testGuild, "testInteger1"))
            .deep.equal(["42", "number", 42]);
    });

    it("write environment explicitly typed integer to DB", () => {
        db._setEnvironmentVariable(testGuild, "testInteger2", "42", "number");
        expect(db._getEnvironmentVariable(testGuild, "testInteger2"))
            .deep.equal(["42", "number", 42]);
    });

    it("write environment implicitly typed float to DB", () => {
        db._setEnvironmentVariable(testGuild, "testFloat1", 3.14);
        expect(db._getEnvironmentVariable(testGuild, "testFloat1"))
            .deep.equal(["3.14", "number", 3.14]);
    });

    it("write environment explicitly typed float to DB", () => {
        db._setEnvironmentVariable(testGuild, "testFloat2", "3.14", "number");
        expect(db._getEnvironmentVariable(testGuild, "testFloat2"))
            .deep.equal(["3.14", "number", 3.14]);
    });

    it("write environment implicitly typed string to DB", () => {
        db._setEnvironmentVariable(testGuild, "testString1", "hello world");
        expect(db._getEnvironmentVariable(testGuild, "testString1"))
            .deep.equal(["hello world", "string", "hello world"]);
    });

    it("write environment explicitly typed string to DB", () => {
      db._setEnvironmentVariable(testGuild, "testString2", "hello world", "string");
      expect(db._getEnvironmentVariable(testGuild, "testString2"))
            .deep.equal(["hello world", "string", "hello world"]);
  });

  it("overwrite environment implicitly to implicitly typed boolean to DB", () => {
      db._setEnvironmentVariable(testGuild, "testBooleanOW1", true);
      db._setEnvironmentVariable(testGuild, "testBooleanOW1", false);
      expect(db._getEnvironmentVariable(testGuild, "testBooleanOW1"))
            .deep.equal(["false", "boolean", false]);
  });

  it("overwrite environment explicitly to explicitly typed boolean to DB", () => {
      db._setEnvironmentVariable(testGuild, "testBooleanOW2", true);
      db._setEnvironmentVariable(testGuild, "testBooleanOW2", "false", "boolean");
      expect(db._getEnvironmentVariable(testGuild, "testBooleanOW2"))
            .deep.equal(["false", "boolean", false]);
  });
});
