import { DBPatch } from "./DBPatch";
import { Patch1 } from "./Patch1";
import { Patch10 } from "./Patch10";
import { Patch2 } from "./Patch2";
import { Patch3 } from "./Patch3";
import { Patch4 } from "./Patch4";
import { Patch5 } from "./Patch5";
import { Patch6 } from "./Patch6";
import { Patch7 } from "./Patch7";
import { Patch8 } from "./Patch8";
import { Patch9 } from "./Patch9";
import { Patch0 } from "./Patch0";
import { Patch11 } from "./Patch11";

export const allPatches: (typeof DBPatch)[] =
    [Patch0, Patch1, Patch2, Patch3, Patch4, Patch5, Patch6, Patch7, Patch8, Patch9, Patch10, Patch11];

export function getPatch(patchName: string) {
    return allPatches.find(value => value.name == patchName);
}