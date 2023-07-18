import { Type } from "@mikro-orm/core";
import { DateTime } from "luxon";

export class LuxonDateTimeType extends Type<DateTime | undefined, string | undefined> {
    public convertToDatabaseValue(value: DateTime | undefined): string | undefined {
        if (value === undefined) {
            return undefined;
        }
        return value.toUTC().toSQL({ includeOffset: false })!;
    }

    public convertToJSValue(value: string | undefined): DateTime | undefined {
        if (value === undefined) {
            return undefined;
        }
        return DateTime.fromSQL(`${value}`, { zone: "UTC" });
    }

    getColumnType(): string {
        return "timestamp";
    }
}
