import { Type } from "@mikro-orm/core";
import moment, { Moment } from "moment-timezone";

export class MomentType extends Type<Moment | undefined, string | undefined> {
    convertToDatabaseValue(value: Moment | undefined): string | undefined {
        if (value === undefined) {
            return undefined;
        }

        return value.utc().toISOString(true);
    }

    convertToJSValue(value: string | undefined): Moment | undefined {
        if (value === undefined) {
            return undefined;
        }

        return moment.utc(value, true);
    }

    getColumnType(): string {
        return "timestamp";
    }
}
