import { Database } from "../DB";
import { log } from "../Util";
import { DBPatch } from "./DBPatch";

export class DatabasePatcher {
    private readonly database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    public createPatch<T extends DBPatch>(type: { new(db: Database): T ;}, db :Database): T {
        return new type(db);
    }

    async applyPatch(patchName: typeof DBPatch, revert: boolean = false) {
        let patch: DBPatch;
        try {
            patch = this.createPatch(patchName, this.database);
            if (patch) {
                if (revert) {
                    log("info", `Reverting patch '${patchName.name}'.`)
                    await patch.revert();
                    log("info", "Patch reversion done.")
                } else {
                    log("info", `Applying patch '${patchName.name}'.`)
                    await patch.execute();
                    log("info", "Patch application done.")
                }
            }
        } finally {
            patch.close() // free database after applying/reverting the patch
        }
    }

    async applyPatches(patches: typeof DBPatch[], revert: boolean = false) {
        let ps = revert === true ? patches.reverse() : patches;
        for (let p of ps) {
            await this.applyPatch(p, revert === true);
        }
    }
}