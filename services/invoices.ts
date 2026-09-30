import { desc, eq } from "drizzle-orm";
import { clients, deals, invoices, type InvoiceStatus } from "@/db/schema";
import { db, type DbClient } from "@/lib/db";
import type { InvoiceInput } from "@/lib/validations";

export async function listInvoices(dbc: DbClient = db) {
  const rows = await dbc
    .select({
      invoice: invoices,
      clientName: clients.name,
      dealTitle: deals.title,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(deals, eq(invoices.dealId, deals.id))
    .orderBy(desc(invoices.createdAt));
  return rows.map((r) => ({
    ...r.invoice,
    clientName: r.clientName,
    dealTitle: r.dealTitle,
  }));
}

export async function createInvoice(input: InvoiceInput, dbc: DbClient = db) {
  const [row] = await dbc
    .insert(invoices)
    .values({
      number: input.number,
      dealId: input.dealId || null,
      clientId: input.clientId,
      amountCents: input.amountCents,
      status: input.status,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      issuedAt: input.status === "draft" ? null : new Date(),
      notes: input.notes || null,
    })
    .returning();
  return row;
}

export async function setInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  dbc: DbClient = db
) {
  const patch: Partial<{ status: InvoiceStatus; paidAt: Date | null; issuedAt: Date | null }> = {
    status,
  };
  if (status === "paid") patch.paidAt = new Date();
  if (status === "sent") patch.issuedAt = new Date();
  const [row] = await dbc
    .update(invoices)
    .set(patch)
    .where(eq(invoices.id, id))
    .returning();
  return row ?? null;
}

export async function deleteInvoice(id: string, dbc: DbClient = db) {
  await dbc.delete(invoices).where(eq(invoices.id, id));
}

export async function invoiceTotals(dbc: DbClient = db) {
  const all = await dbc.select().from(invoices);
  return {
    outstandingCents: all
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((s, i) => s + i.amountCents, 0),
    paidCents: all
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amountCents, 0),
    overdueCount: all.filter((i) => i.status === "overdue").length,
  };
}
