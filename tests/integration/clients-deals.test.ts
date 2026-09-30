import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./setup";
import { createClient, getClient, updateClient } from "@/services/clients";
import { createDeal, listDeals, moveDeal, pipelineTotals } from "@/services/deals";
import { logActivity, listDealActivities } from "@/services/activities";

let dbc: TestDb;
let cleanup: () => void;
let clientId: string;

beforeAll(() => {
  ({ dbc, cleanup } = createTestDb());
});

afterAll(() => cleanup());

describe("clients service", () => {
  it("creates and retrieves a client", async () => {
    const client = await createClient(
      { name: "Test Client", email: "test@example.com", tags: ["test"] },
      dbc
    );
    clientId = client.id;
    expect(client.name).toBe("Test Client");

    const fetched = await getClient(clientId, dbc);
    expect(fetched?.client.email).toBe("test@example.com");
    expect(fetched?.deals).toHaveLength(0);
    expect(fetched?.timeline).toHaveLength(0);
  });

  it("updates a client", async () => {
    const updated = await updateClient(
      clientId,
      { name: "Renamed Client", email: "test@example.com", tags: [] },
      dbc
    );
    expect(updated?.name).toBe("Renamed Client");
  });
});

describe("deals service", () => {
  let dealId: string;

  it("creates a deal linked to the client", async () => {
    const deal = await createDeal(
      {
        title: "Integration test deal",
        clientId,
        valueCents: 500000,
        stage: "lead",
        probability: 30,
      },
      dbc
    );
    dealId = deal.id;
    const deals = await listDeals(undefined, dbc);
    expect(deals.some((d) => d.id === dealId)).toBe(true);
    expect(deals.find((d) => d.id === dealId)?.clientName).toBe("Renamed Client");
  });

  it("moves a deal between stages", async () => {
    const moved = await moveDeal(dealId, "proposal", dbc);
    expect(moved?.stage).toBe("proposal");
  });

  it("computes pipeline totals", async () => {
    const totals = await pipelineTotals(dbc);
    expect(totals.byStage.proposal.count).toBe(1);
    expect(totals.byStage.proposal.valueCents).toBe(500000);
    expect(totals.openValueCents).toBe(500000);
  });
});

describe("activities service", () => {
  it("logs activity and touches the deal's lastActivityAt", async () => {
    const deals = await listDeals(undefined, dbc);
    const dealId = deals[0]!.id;

    await logActivity(
      {
        clientId,
        dealId,
        type: "call",
        subject: "Kickoff call",
        body: "Discussed scope.",
      },
      dbc
    );

    const timeline = await listDealActivities(dealId, dbc);
    expect(timeline.some((a) => a.subject === "Kickoff call")).toBe(true);

    const refreshed = (await listDeals(undefined, dbc)).find((d) => d.id === dealId)!;
    expect(refreshed.lastActivityAt).not.toBeNull();
  });
});
