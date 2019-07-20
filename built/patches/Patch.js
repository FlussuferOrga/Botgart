"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
* Patches are small scripts that bring the database or filesystem up to date.
* The most trivial case is to create a new table in the database.
* More complex usecases where the database has to be populated from the GW2 API etc.
* are conceivable.
* Patches are expected to go in a linear fashion. I.e., while patches have preconditions
* to make sure they can actually be executed (think: Patch B adds a column to a database table,
* but Patch A must have created that table first). This mechanism serves more as a sanity check,
* and is only a very weak safety not -- circular dependencies and other fancy stuff is not
* detected!
*/
const Util_1 = require("../Util");
class Patch {
    /**
    * Checks, if this patch has already been executed.
    * This method obviously doesn't need to be implemented
    * for idempotent patches and can be left as is.
    * @returns true, if the patch has already been applied or is otherwise satisfied, else false.
    */
    satisfied() {
        return __awaiter(this, void 0, void 0, function* () { return false; });
    }
    /**
    * Checks, if the preconditions to apply this patch have been satisfied.
    * If this method returns false, the patch can not be applied.
    * @returns true, if the preconditions are met. Else false.
    */
    checkPreconditions() {
        return __awaiter(this, void 0, void 0, function* () { return true; });
    }
    /**
    * Checks, if the postconditions after applying this patch are satisfied.
    * If this method returns false, the patch must be rolled back.
    * @returns true, if the postconditions are met. Else false.
    */
    checkPostconditions() {
        return __awaiter(this, void 0, void 0, function* () { return true; });
    }
    /**
    * This does the actual patch work. If the changes are trivial, you can
    * only implement this method. If something could go wrong, you should
    * implement checkPostconditions(), commit() and rollback() to take
    * appropriate action if something should go wrong.
    */
    apply() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
    * Reverts the patch. This method is probably not going to be used,
    * since we're not likely to revert to old versions, but should be
    * implemented anyway...
    * Has no pre- or postchecks, so all the work should be done within this method.
    */
    revert() {
        return __awaiter(this, void 0, void 0, function* () { throw new Error("Undefined revert method for {0}.".formatUnicorn(this.constructor.name)); });
    }
    /**
    * This method can be used to manifest the changes from apply().
    * Can be left blank if the changes are trivial and
    * have already been manifested in apply().
    * Example usecase (1): rows have been added to a DB table, this is the
    * place to call dbconnection.commit().
    * Usecase (2): apply() only created a file, there is nothing left to be done.
    */
    commit() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
    * This method can be used to revert the changes from apply()
    * before manifesting them. Can be left blank if the changes are trivial
    * or don't need to be rolled back if checkPostConditions() fails.
    * Example usecase (1): creating rows has failed due to a foreign key constraint,
    * this is the place to call dbconnection.rollback().
    * Usecase (2): apply() tried to create a file and failed. Nothing left to do.
    */
    rollback() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.satisfied()) {
                Util_1.log("notice", "Patch.js", "Patch {0} is already satisfied and will not be applied.".formatUnicorn(this.constructor.name));
                return;
            }
            if (!(yield this.checkPreconditions())) {
                Util_1.log("error", "Patch.js", "Could not execute patch {0} due to unfulfilled preconditions. Please consult the log.".formatUnicorn(this.constructor.name));
                return;
            }
            Util_1.log("info", "Patch.js", "Attempting to apply patch {0}.".formatUnicorn(this.constructor.name));
            yield this.apply();
            Util_1.log("info", "Patch.js", "Application finished.");
            if (yield this.checkPostconditions()) {
                Util_1.log("notice", "Patch.js", "Postconditions for patch {0} are met. Committing.".formatUnicorn(this.constructor.name));
                yield this.commit();
            }
            else {
                Util_1.log("error", "Patch.js", "Postconditions for patch {0} are not met. Rolling back.".formatUnicorn(this.constructor.name));
                yield this.rollback();
            }
        });
    }
}
exports.Patch = Patch;
