import { db, type DbClient } from "@/lib/db";
import {
  seedDemoData,
  type SeedDemoDataSummary,
} from "@/db/seed";

// ---------- Demo workspace reset ----------

/**
 * Resets the demo workspace: wipes it and re-seeds it anchored to today,
 * so the live demo never goes stale.
 *
 * Demo-only by design: this app ships as a public demo with a single
 * shared workspace. If per-user auth is ever introduced, this must stay
 * scoped to the demo workspace or be removed.
 */
export async function resetDemoData(
  dbc: DbClient = db
): Promise<SeedDemoDataSummary> {
  return seedDemoData(dbc);
}
