import * as L from "../../Locale";

export class WvwMap {
    static readonly EternalBattlegrounds = new WvwMap("📙", "ETERNAL_BATTLEGROUNDS", ["EBG"]);
    static readonly RedBorderlands = new WvwMap("📕", "RED_BORDERLANDS", ["RBL"]);
    static readonly BlueBorderlands = new WvwMap("📘", "BLUE_BORDERLANDS", ["BBL"]);
    static readonly GreenBorderlands = new WvwMap("📗", "GREEN_BORDERLANDS", ["GBL"]);

    static getMaps(): WvwMap[] {
        return [WvwMap.EternalBattlegrounds, WvwMap.RedBorderlands, WvwMap.BlueBorderlands, WvwMap.GreenBorderlands];
    }

    static getMapNames(): string[] {
        return WvwMap.getMaps().map(m => m.name);
    }

    static getAllMapNames(): string[] {
        return WvwMap.getMaps().map(m => m.getAllNames())
            .reduce((acc, m) => acc.concat(m), []);
    }

    static getMapByEmote(emote: string): WvwMap {
        return WvwMap.getMaps().filter(m => m.emote === emote)[0] // yields undefined if no match
    }

    static getMapByName(name: string): WvwMap {
        return WvwMap.getMaps().filter(m => m.getAllNames().includes(name))[0] // yields undefined if no match
    }

    public readonly emote: string;
    public readonly name: string;
    public readonly aliases: string[];

    public getLocalisedName(separator = "\n", flags = true): string {
        return L.get(this.name, [], separator, flags);
    }

    public getAllNames(): string[] {
        return this.aliases.concat([this.name]);
    }

    private constructor(emote: string, name: string, aliases: string[]) {
        this.emote = emote;
        this.name = name;
        this.aliases = aliases;
    }
}