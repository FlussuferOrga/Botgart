import * as Util from "../../util/Util";

export class ResetLeader implements Util.Equalable<ResetLeader> {
    public readonly name: string;
    private visible: boolean;

    public isOpenlyVisible(): boolean {
        return this.visible;
    }

    public setVisiblity(v: boolean): void {
        this.visible = v;
    }

    public toggleVisibility(): void {
        this.visible = !this.visible;
    }

    public constructor(name: string, visible: boolean) {
        this.name = name;
        this.visible = visible;
    }

    public equals(other: ResetLeader): boolean {
        return other.name === this.name;
    }
}
