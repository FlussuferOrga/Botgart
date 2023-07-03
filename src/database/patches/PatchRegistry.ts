import {DBPatch} from "./DBPatch";
import {Patch10} from "./Patch10";
import {Patch7} from "./Patch7";
import {Patch9} from "./Patch9";
import {Patch11} from "./Patch11";
import {Patch12} from "./Patch12";
import {Patch13} from "./Patch13";
import {Patch14} from "./Patch14";

export const allPatches: (typeof DBPatch)[] = [Patch7, Patch9, Patch10, Patch11, Patch12, Patch13, Patch14];

export function getPatch(patchName: string) {
    return allPatches.find((value) => value.name == patchName);
}
