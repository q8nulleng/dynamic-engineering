/**
 * MySQL (TiDB) database connection using Drizzle ORM
 * Replaces the SQLite-based db/index.ts
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema.js";

let _pool: mysql.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _pool = mysql.createPool(url);
    _db = drizzle(_pool, { schema, mode: "default" });
  }
  return _db;
}

export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

// Re-export schema tables for convenience
export {
  schema,
};
