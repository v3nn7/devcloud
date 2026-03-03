import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const rootDir = process.cwd();
const dbDir = path.join(rootDir, "db");
const dbPath = path.join(dbDir, "devcloud.db");
const schemaPath = path.join(dbDir, "schema.sql");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);
db.close();

console.log("Database initialized:", dbPath);
