import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./setup";
import { clients, deals, activities, followups, invoices } from "@/db/schema";
import { seedDemoData } from "@/db/seed";
import { resetDemoData } from "@/services/demo";
import { createClient, getClient } from "@/services/clients";

let dbc: TestDb;
let cleanup: () => void;

beforeAll(() => {
  ({ dbc, cleanup } = createTestDb());
});

afterAll(() => cleanup());

const NOW_A = new Date(2026, 9, 20, 12, 0, 0); // Oct 20, 2026
const NOW_B = new Date(2026, 10, 19, 12, 0, 0); // Nov 19, 2026

async function counts() {
  return {
    clients: (await dbc.select().from(clients)).length,
    deals: (await dbc.select().from(deals)).length,
    activities: (await dbc.select().from(activities)).length,
    followups: (await dbc.select().from(followups)).length,
    invoices: (await dbc.select().from(invoices)).length,
  };
}

async function closeDateOfBookingPlatform(): Promise<number> {
  const rows = await dbc.select().from(deals);
  const row = rows.find((d) => d.title === "Booking platform");
  return row!.expectedCloseDate!.getTime();
}

describe("demo workspace reset", () => {
  it("seeds the full demo dataset and returns a summary", async () => {
    const summary = await seedDemoData(dbc, { now: NOW_A });
    expect(summary).toEqual({
      clients: 8,
      deals: 15,
      activities: 16,
      followups: 5,
      invoices: 3,
    });
    expect(await counts()).toEqual(summary);
  });

  it("is idempotent — reseeding yields the same rows", async () => {
    await seedDemoData(dbc, { now: NOW_A });
    expect(await counts()).toEqual({
      clients: 8,
      deals: 15,
      activities: 16,
      followups: 5,
      invoices: 3,
    });
  });

  it("re-anchors all relative dates to the given now", async () => {
    await seedDemoData(dbc, { now: NOW_A });
    const closeA = await closeDateOfBookingPlatform();
    await seedDemoData(dbc, { now: NOW_B });
    const closeB = await closeDateOfBookingPlatform();
    // Booking platform closes 12 days after "today" in both runs
    expect(closeB - closeA).toBe(NOW_B.getTime() - NOW_A.getTime());
  });

  it("wipes user-added rows — reset restores exactly the demo dataset", async () => {
    const extra = await createClient(
      { name: "Extra Client", email: "extra@example.com", tags: [] },
      dbc
    );
    expect(await getClient(extra.id, dbc)).toBeTruthy();
    await resetDemoData(dbc);
    expect(await getClient(extra.id, dbc)).toBeNull();
    expect(await counts()).toEqual({
      clients: 8,
      deals: 15,
      activities: 16,
      followups: 5,
      invoices: 3,
    });
  });
});
