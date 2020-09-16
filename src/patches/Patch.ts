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
import { log } from "../Util";

export class Patch {
    /**
    * Checks, if this patch has already been executed. 
    * This method obviously doesn't need to be implemented 
    * for idempotent patches and can be left as is.
    * @returns true, if the patch has already been applied or is otherwise satisfied, else false.
    */
    protected async satisfied(): Promise<boolean> { return false; }

    /**
    * Checks, if the preconditions to apply this patch have been satisfied.
    * If this method returns false, the patch can not be applied.
    * @returns true, if the preconditions are met. Else false. 
    */
    protected async checkPreconditions(): Promise<boolean> { return true; }

    /**
    * Checks, if the postconditions after applying this patch are satisfied. 
    * If this method returns false, the patch must be rolled back.
    * @returns true, if the postconditions are met. Else false. 
    */
    protected async checkPostconditions(): Promise<boolean> { return true; }

    /**
    * This does the actual patch work. If the changes are trivial, you can
    * only implement this method. If something could go wrong, you should 
    * implement checkPostconditions(), commit() and rollback() to take
    * appropriate action if something should go wrong. 
    */
    protected async apply(): Promise<void> {}

    /**
    * Reverts the patch. This method is probably not going to be used, 
    * since we're not likely to revert to old versions, but should be
    * implemented anyway...  
    * Has no pre- or postchecks, so all the work should be done within this method.
    */
    public async revert(): Promise<void> { throw new Error("Undefined revert method for {0}.".formatUnicorn(this.constructor.name)); }

    /**
    * This method can be used to manifest the changes from apply().
    * Can be left blank if the changes are trivial and 
    * have already been manifested in apply().
    * Example usecase (1): rows have been added to a DB table, this is the 
    * place to call dbconnection.commit(). 
    * Usecase (2): apply() only created a file, there is nothing left to be done.
    */ 
    protected async commit(): Promise<void> {}

    /**
    * This method can be used to revert the changes from apply()
    * before manifesting them. Can be left blank if the changes are trivial
    * or don't need to be rolled back if checkPostConditions() fails.
    * Example usecase (1): creating rows has failed due to a foreign key constraint,
    * this is the place to call dbconnection.rollback().
    * Usecase (2): apply() tried to create a file and failed. Nothing left to do.
    */
    protected async rollback(): Promise<void> {}

    public async execute(): Promise<void> { 
        if(await this.satisfied()) {
            log("notice", "Patch {0} is already satisfied and will not be applied.".formatUnicorn(this.constructor.name))
            return;
        }
        if(! await this.checkPreconditions()) {
            log("error", "Could not execute patch {0} due to unfulfilled preconditions. Please consult the log.".formatUnicorn(this.constructor.name))
            return;
        }
        log("info", "Attempting to apply patch {0}.".formatUnicorn(this.constructor.name))
        await this.apply();
        log("info", "Application finished.")
        if(await this.checkPostconditions()) {
            log("notice", "Postconditions for patch {0} are met. Committing.".formatUnicorn(this.constructor.name))
            await this.commit();
        } else {
            log("error", "Postconditions for patch {0} are not met. Rolling back.".formatUnicorn(this.constructor.name))
            await this.rollback();
        }
    }

}