declare global {
    interface String {
        formatUnicorn(...fnargs: unknown[]): string;
    }
}

// taken from https://stackoverflow.com/a/18234317
if (!String.prototype.formatUnicorn) {
    String.prototype.formatUnicorn = function (...fnargs: unknown[]): string {
        let str = this.toString();
        if (fnargs.length) {
            const t = typeof fnargs[0];
            const args = ("string" === t || "number" === t) ? Array.prototype.slice.call(fnargs) : fnargs[0];
            for (const key in args) {
                str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
            }
        }
        return str;
    };
}

export {};