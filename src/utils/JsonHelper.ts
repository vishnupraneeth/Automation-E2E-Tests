import fs from "fs";
import * as path from 'path';
export class JsonHelper {
    static readJson(filePath: string): Record<string, string>[] {
        const absolutePath = path.resolve(process.cwd(), filePath);
        return JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
    }
}