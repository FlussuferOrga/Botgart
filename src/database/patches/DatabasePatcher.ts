import { logger } from "../../util/Logging";
import { Database } from "../Database";
import { DBPatch } from "./DBPatch";

const LOG = logger();

export class DatabasePatcher {
    private readonly database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    public createPatch<T extends DBPatch>(type: { new(db: Database): T ;}, db :Database): T {
        return new type(db);
    }

    async applyPatch(patchName: typeof DBPatch, revert: boolean = false) {
        let patch: DBPatch | undefined = undefined;
        try {
            patch = this.createPatch(patchName, this.database);
            if (patch) {
                if (revert) {
                    LOG.info(`Reverting patch '${patchName.name}'.`)
                    await patch.revert();
                    LOG.info("Patch reversion done.")
                } else {
                    LOG.info(`Applying patch '${patchName.name}'.`)
                    await patch.execute();
                    LOG.info("Patch application done.")
                }
            }
        } finally {
            if(patch !== undefined) {
                patch.close() // free database after applying/reverting the patch    
            }
        }
    }

    async applyPatches(patches: typeof DBPatch[], revert: boolean = false) {
        const ps = revert === true ? patches.reverse() : patches;
        for (let p of ps) {
            await this.applyPatch(p, revert === true);
        }
    }
}