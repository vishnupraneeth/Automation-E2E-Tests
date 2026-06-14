import fs from "fs";
import * as path from 'path';

export class JsonHelperApi {
    static readJson<T = any>(filePath: string): T {
        const absolutePath = path.resolve(process.cwd(), filePath);
        return JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
    }
}
