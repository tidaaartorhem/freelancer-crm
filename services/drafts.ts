import { desc, eq } from "drizzle-orm";
import { clients, deals, drafts, type DraftStatus } from "@/db/schema";
import { db, type DbClient } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { detectAtRisk } from "@/lib/at-risk";
import { getProvider } from "./ai";
import { listDealActivities } from "./activities";

/**
 * Approval queue for AI-drafted follow-ups.
 * Drafts are created as "pending". A human must explicitly approve one
 * before it can be marked "sent". Nothing auto-sends, ever.
 */

export async function listDrafts(
  status?: DraftStatus,
  dbc: DbClient = db
) {
  const rows = await dbc
    .select({
      draft: drafts,
      dealTitle: deals.title,
      clientName: clients.name,
    })
    .from(drafts)
    .innerJoin(deals, eq(drafts.dealId, deals.id))
    .innerJoin(clients, eq(drafts.clientId, clients.id))
    .orderBy(desc(drafts.createdAt));
  const mapped = rows.map((r) => ({
    ...r.draft,
    dealTitle: r.dealTitle,
    clientName: r.clientName,
  }));
  return status ? mapped.filter((d) => d.status === status) : mapped;
}

/** Run the AI pipeline assistant for one deal: detect risk, draft, queue. */
export async function generateDraftForDeal(dealId: string, dbc: DbClient = db) {
  const [deal] = await dbc.select().from(deals).where(eq(deals.id, dealId));
  if (!deal) throw new Error("Deal not found");
  if (deal.stage !== "proposal" && deal.stage !== "negotiation") {
    throw new Error("Drafts can only be generated for proposal/negotiation deals");
  }
  const [client] = await dbc
    .select()
    .from(clients)
    .where(eq(clients.id, deal.clientId));
  if (!client) throw new Error("Client not found");

  const now = new Date();
  const risk = detectAtRisk(
    {
      id: deal.id,
      title: deal.title,
      stage: deal.stage,
      expectedCloseDate: deal.expectedCloseDate,
      lastActivityAt: deal.lastActivityAt,
      createdAt: deal.createdAt,
    },
    now
  );

  const recent = await listDealActivities(dealId, dbc);
  const lastActivitySummary =
    recent[0]?.body?.slice(0, 140) ?? recent[0]?.subject ?? null;
  const reference = deal.lastActivityAt ?? deal.createdAt;
  const daysSinceActivity = Math.max(
    0,
    Math.floor((now.getTime() - reference.getTime()) / 86_400_000)
  );

  const provider = getProvider();
  const result = await provider.draftFollowUp({
    dealTitle: deal.title,
    clientName: client.name,
    company: client.company,
    dealValue: formatMoney(deal.valueCents),
    stage: deal.stage,
    daysSinceActivity,
    riskReasons: risk.reasons,
    lastActivitySummary,
  });

  const [draft] = await dbc
    .insert(drafts)
    .values({
      dealId: deal.id,
      clientId: client.id,
      subject: result.subject,
      body: result.body,
      provider: provider.id,
      model: provider.model ?? null,
      status: "pending",
    })
    .returning();

  return { draft, risk };
}

export async function approveDraft(id: string, dbc: DbClient = db) {
  const [row] = await dbc
    .update(drafts)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(drafts.id, id))
    .returning();
  return row ?? null;
}

export async function rejectDraft(id: string, dbc: DbClient = db) {
  const [row] = await dbc
    .update(drafts)
    .set({ status: "rejected", reviewedAt: new Date() })
    .where(eq(drafts.id, id))
    .returning();
  return row ?? null;
}

/** Mark an approved draft as sent (records that the human sent it). */
export async function markDraftSent(id: string, dbc: DbClient = db) {
  const [existing] = await dbc.select().from(drafts).where(eq(drafts.id, id));
  if (!existing) return null;
  if (existing.status !== "approved") {
    throw new Error("Only approved drafts can be marked as sent");
  }
  const [row] = await dbc
    .update(drafts)
    .set({ status: "sent" })
    .where(eq(drafts.id, id))
    .returning();
  return row;
}

export async function deleteDraft(id: string, dbc: DbClient = db) {
  await dbc.delete(drafts).where(eq(drafts.id, id));
}
