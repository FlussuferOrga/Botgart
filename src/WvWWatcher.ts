import { EventEmitter } from "events";
import * as moment from "moment";
import { getConfig } from "./config/Config";
import { createApiInstance } from "./Gw2ApiUtils";
import { Matchup, MatchupRepository } from "./repositories/MatchupRepository";
import * as Util from "./Util";

export class WvWWatcher extends EventEmitter {
    private api;
    private matchupRepository: MatchupRepository;

    public constructor(matchupRepository: MatchupRepository) {
        super();
        this.api = createApiInstance();
        this.matchupRepository = matchupRepository;
    }

    /**
     * Resolves the Database entry for the currently ongoing match for the home world.
     * If no match exists for that time, a new match will be created in the database
     * with data retrieved from the API and that newly created match is returned.
     * returns: the DB matchup info for the ongoing match.
     *          If no such match existed during the call, it will be created
     */
    public async getCurrentMatch(): Promise<Matchup | undefined> {
        const now: moment.Moment = moment.utc();
        let dbMatchup: Matchup | undefined = this.matchupRepository.getCurrentMatchup(now);
        if (dbMatchup === undefined) {
            const latestDbMatchup: Matchup | undefined = this.matchupRepository.getLatestMatchup();
            const homeId = (await getConfig()).get().home_id;
            const currentMatchupInfo = await this.api.wvw().matches().overview().world(homeId);
            const tier = currentMatchupInfo.id.split("-")[1]; // format is "x-y", x being 1 for NA, 2 for EU, y being the tier.
            this.matchupRepository.addMatchup(
                tier,
                moment.utc(currentMatchupInfo.start_time),
                moment.utc(currentMatchupInfo.end_time),
                currentMatchupInfo.all_worlds.red,
                currentMatchupInfo.all_worlds.green,
                currentMatchupInfo.all_worlds.blue);
            dbMatchup = this.matchupRepository.getCurrentMatchup(now);
            if (dbMatchup == undefined) {
                Util.log("error", "Should have produced a new matchup. But after retrieving the latest matchup thereafter, it is still undefined.");
            } else {
                this.emit("new-matchup", {lastMatchup: latestDbMatchup, newMatchup: dbMatchup});
            }

        }
        return dbMatchup;
    }
}