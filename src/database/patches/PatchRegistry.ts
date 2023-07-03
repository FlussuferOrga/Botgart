import {DBPatch} from "./DBPatch";
import {Patch1} from "./Patch1";
import {Patch10} from "./Patch10";
import {Patch2} from "./Patch2";
import {Patch3} from "./Patch3";
import {Patch4} from "./Patch4";
import {Patch5} from "./Patch5";
import {Patch6} from "./Patch6";
import {Patch7} from "./Patch7";
import {Patch9} from "./Patch9";
import {Patch0} from "./Patch0";
import {Patch11} from "./Patch11";
import {Patch12} from "./Patch12";
import {Patch13} from "./Patch13";

export const allPatches: (typeof DBPatch)[] = [Patch0, Patch1, Patch2, Patch3, Patch4, Patch5, Patch6, Patch7, Patch9, Patch10, Patch11, Patch12, Patch13];

export function getPatch(patchName: string) {
    return allPatches.find((value) => value.name == patchName);
}
