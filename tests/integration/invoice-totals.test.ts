import { addDays } from "date-fns";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./setup";
import { clients } from "@/db/schema";
import { createClient } from "@/services/clients";
import { createInvoice, invoiceTotals } from "@/services/invoices";

let dbc: TestDb;
let cleanup: () => void;
let clientId: string;

const NOW = new Date(2026, 9, 20, 12, 0, 0); // Oct 20, 2026

beforeAll(async () => {
  ({ dbc, cleanup } = createTestDb());
  const client = await createClient(
    { name: "Totals Client", email: "totals@example.com", tags: [] },
    dbc
  );
  clientId = client.id;

  const due = (daysFromNow: number) =>
    addDays(NOW, daysFromNow).toISOString().slice(0, 10);

  // sent + past due → overdue
  await createInvoice(
    {
      number: "INV-T-001",
      clientId,
      amountCents: 100000,
      status: "sent",
      dueDate: due(-5),
    },
    dbc
  );
  // sent + future due → outstanding but not overdue
  await createInvoice(
    {
      number: "INV-T-002",
      clientId,
      amountCents: 200000,
      status: "sent",
      dueDate: due(5),
    },
    dbc
  );
  // draft + past due → not outstanding, not overdue
  await createInvoice(
    {
      number: "INV-T-003",
      clientId,
      amountCents: 300000,
      status: "draft",
      dueDate: due(-5),
    },
    dbc
  );
  // paid + past due → not overdue
  await createInvoice(
    {
      number: "INV-T-004",
      clientId,
      amountCents: 400000,
      status: "paid",
      dueDate: due(-5),
    },
    dbc
  );
});

afterAll(() => cleanup());

describe("invoiceTotals overdue counting", () => {
  it("counts sent invoices past their due date as overdue", async () => {
    const totals = await invoiceTotals(dbc, NOW);
    expect(totals.overdueCount).toBe(1);
  });

  it("only counts sent invoices as outstanding", async () => {
    const totals = await invoiceTotals(dbc, NOW);
    expect(totals.outstandingCents).toBe(300000);
    expect(totals.paidCents).toBe(400000);
  });
});
