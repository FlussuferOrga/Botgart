import { expect } from "chai";
import fs from "fs";
import { Database } from "../database/Database";
import { DatabasePatcher } from "../database/patches/DatabasePatcher";
import { allPatches } from "../database/patches/PatchRegistry";
import { EnvironmentVariablesRepository } from "../repositories/EnvironmentVariablesRepository";
import "../util/string.extensions";

describe("DB", function () {
    const testGuild = "00000";
    const databaseFilePath = "./db/test-database.db";

    let db: Database;
    let repo: EnvironmentVariablesRepository;

    before("setupDatabase", function (done) {
        db = Database.getInstance(databaseFilePath);
        repo = new EnvironmentVariablesRepository(db);
        done();
    });
    before("patchDatabase", async function () {
        await new DatabasePatcher(db).applyPatches(allPatches, false);
    });

    after("cleanup", function (done) {
        fs.unlink(databaseFilePath, done);
    });

    it("write environment implicitly typed boolean to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testBoolean1", true);
        expect(repo._getEnvironmentVariable(testGuild, "testBoolean1"))
            .deep.equal(["true", "boolean", true]);
    });

    it("write environment explicitly typed boolean to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testBoolean2", "true", "boolean");
        expect(repo._getEnvironmentVariable(testGuild, "testBoolean2"))
            .deep.equal(["true", "boolean", true]);
    });

    it("write environment implicitly typed integer to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testInteger1", 42);
        expect(repo._getEnvironmentVariable(testGuild, "testInteger1"))
            .deep.equal(["42", "number", 42]);
    });

    it("write environment explicitly typed integer to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testInteger2", "42", "number");
        expect(repo._getEnvironmentVariable(testGuild, "testInteger2"))
            .deep.equal(["42", "number", 42]);
    });

    it("write environment implicitly typed float to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testFloat1", 3.14);
        expect(repo._getEnvironmentVariable(testGuild, "testFloat1"))
            .deep.equal(["3.14", "number", 3.14]);
    });

    it("write environment explicitly typed float to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testFloat2", "3.14", "number");
        expect(repo._getEnvironmentVariable(testGuild, "testFloat2"))
            .deep.equal(["3.14", "number", 3.14]);
    });

    it("write environment implicitly typed string to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testString1", "hello world");
        expect(repo._getEnvironmentVariable(testGuild, "testString1"))
            .deep.equal(["hello world", "string", "hello world"]);
    });

    it("write environment explicitly typed string to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testString2", "hello world", "string");
        expect(repo._getEnvironmentVariable(testGuild, "testString2"))
            .deep.equal(["hello world", "string", "hello world"]);
    });

    it("overwrite environment implicitly to implicitly typed boolean to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testBooleanOW1", true);
        repo._setEnvironmentVariable(testGuild, "testBooleanOW1", false);
        expect(repo._getEnvironmentVariable(testGuild, "testBooleanOW1"))
            .deep.equal(["false", "boolean", false]);
    });

    it("overwrite environment explicitly to explicitly typed boolean to DB", () => {
        repo._setEnvironmentVariable(testGuild, "testBooleanOW2", true);
        repo._setEnvironmentVariable(testGuild, "testBooleanOW2", "false", "boolean");
        expect(repo._getEnvironmentVariable(testGuild, "testBooleanOW2"))
            .deep.equal(["false", "boolean", false]);
    });
});