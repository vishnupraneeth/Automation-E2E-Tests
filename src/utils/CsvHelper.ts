import fs from "fs";
import { parse } from 'csv-parse/sync';
import * as path from 'path';

export class CsvHelper {

    static readCsv(filePath: string): Record<string, string>[] {
         const absolutePath = path.resolve(process.cwd(), filePath);
        return parse(fs.readFileSync(absolutePath, "utf-8"), {
            columns: true, //first row as headers
            skip_empty_lines: true,
            trim: true, //trim spaces
        }) as Record<string, string>[];
    }
}
