import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./setup";
import { createClient } from "@/services/clients";
import { createDeal, listAtRiskDeals } from "@/services/deals";
import { createFollowup, completeFollowup, listFollowups } from "@/services/followups";
import { createInvoice, setInvoiceStatus, invoiceTotals } from "@/services/invoices";
import {
  approveDraft,
  generateDraftForDeal,
  listDrafts,
  markDraftSent,
} from "@/services/drafts";

let dbc: TestDb;
let cleanup: () => void;
let clientId: string;

beforeAll(() => {
  ({ dbc, cleanup } = createTestDb());
});

afterAll(() => cleanup());

describe("at-risk detection against real rows", () => {
  it("flags a stale proposal deal and ignores fresh ones", async () => {
    const client = await createClient(
      { name: "Risky Client", email: "risky@example.com", tags: [] },
      dbc
    );
    clientId = client.id;

    // Stale: created 20 days ago, no activity since creation
    const stale = await createDeal(
      {
        title: "Stale proposal",
        clientId,
        valueCents: 1000000,
        stage: "proposal",
        probability: 55,
      },
      dbc
    );
    // Backdate: the service sets createdAt to now; simulate staleness by
    // inserting old activity timestamps through a raw update below.
    const { deals } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await dbc
      .update(deals)
      .set({
        createdAt: new Date(Date.now() - 20 * 86_400_000),
        lastActivityAt: new Date(Date.now() - 20 * 86_400_000),
      })
      .where(eq(deals.id, stale.id));

    // Fresh proposal: activity is "now" by default
    await createDeal(
      {
        title: "Fresh proposal",
        clientId,
        valueCents: 200000,
        stage: "proposal",
        probability: 60,
      },
      dbc
    );

    const atRisk = await listAtRiskDeals(new Date(), dbc);
    expect(atRisk.some((d) => d.title === "Stale proposal")).toBe(true);
    expect(atRisk.some((d) => d.title === "Fresh proposal")).toBe(false);
  });
});

describe("follow-ups service", () => {
  it("creates, lists, and completes a follow-up", async () => {
    const fu = await createFollowup(
      {
        title: "Send contract",
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      },
      dbc
    );
    expect(fu.title).toBe("Send contract");

    const open = await listFollowups({ onlyOpen: true }, dbc);
    expect(open.some((f) => f.id === fu.id)).toBe(true);

    await completeFollowup(fu.id, dbc);
    const openAfter = await listFollowups({ onlyOpen: true }, dbc);
    expect(openAfter.some((f) => f.id === fu.id)).toBe(false);
  });
});

describe("invoices service", () => {
  it("creates an invoice and tracks payment", async () => {
    const inv = await createInvoice(
      { clientId, number: "INV-TEST-001", amountCents: 250000, status: "draft" },
      dbc
    );
    expect(inv.status).toBe("draft");

    await setInvoiceStatus(inv.id, "sent", dbc);
    await setInvoiceStatus(inv.id, "paid", dbc);

    const totals = await invoiceTotals(dbc);
    expect(totals.paidCents).toBe(250000);
    expect(totals.outstandingCents).toBe(0);
  });
});

describe("AI draft approval queue", () => {
  let draftId: string;

  it("generates a pending draft for an at-risk deal (mock provider, no keys)", async () => {
    const atRisk = await listAtRiskDeals(new Date(), dbc);
    const deal = atRisk.find((d) => d.title === "Stale proposal")!;
    expect(deal).toBeDefined();

    const { draft, risk } = await generateDraftForDeal(deal.id, dbc);
    draftId = draft.id;
    expect(draft.status).toBe("pending");
    expect(draft.provider).toBe("mock");
    expect(draft.subject).toContain("Stale proposal");
    expect(risk.atRisk).toBe(true);
  });

  it("refuses to mark a pending draft as sent", async () => {
    await expect(markDraftSent(draftId, dbc)).rejects.toThrow(
      "Only approved drafts can be marked as sent"
    );
  });

  it("approves then marks the draft as sent", async () => {
    await approveDraft(draftId, dbc);
    const sent = await markDraftSent(draftId, dbc);
    expect(sent?.status).toBe("sent");

    const pending = await listDrafts("pending", dbc);
    expect(pending.some((d) => d.id === draftId)).toBe(false);
  });
});
