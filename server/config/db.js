import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "./env.js";

const resolvedDbPath = path.resolve(process.cwd(), env.dbPath);
const dbDir = path.dirname(resolvedDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(resolvedDbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schemaPath = path.resolve(process.cwd(), "./db/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);
