import { table } from "table";
import { TableUserConfig } from "table/dist/types/api";

const TABLE_CONFIG: TableUserConfig = {
    "drawHorizontalLine": function (index, size) {
        return index == 0 || index == 1 || index == size;
    }
};

export function createTable(header: string[], data: string[][]): string {
    const tableData = [header, ...data];
    return table(tableData, TABLE_CONFIG);
}