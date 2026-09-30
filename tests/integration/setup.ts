import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import os from "os";
import path from "path";
import * as schema from "@/db/schema";

export type TestDb = BetterSQLite3Database<typeof schema>;

/**
 * Isolated temp database per test file. Services accept a db client
 * parameter, so tests never touch the real dev.db.
 */
export function createTestDb(): { dbc: TestDb; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "freelancer-crm-test-"));
  const file = path.join(dir, "test.db");
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const dbc = drizzle(sqlite, { schema });
  migrate(dbc, { migrationsFolder: "./db/migrations" });

  const cleanup = () => {
    sqlite.close();
    fs.rmSync(dir, { recursive: true, force: true });
  };
  return { dbc, cleanup };
}
