import { desc, eq, inArray } from "drizzle-orm";
import { clients, deals, type Deal, type DealStage } from "@/db/schema";
import { db, type DbClient } from "@/lib/db";
import { detectAtRisk, rankAtRisk, type AtRiskDeal } from "@/lib/at-risk";
import type { DealInput } from "@/lib/validations";

export const STAGES: Array<{ id: DealStage; label: string }> = [
  { id: "lead", label: "Lead" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export type DealWithClient = Deal & { clientName: string; company: string | null };

export async function listDeals(
  stage?: DealStage,
  dbc: DbClient = db
): Promise<DealWithClient[]> {
  const base = dbc
    .select({
      deal: deals,
      clientName: clients.name,
      company: clients.company,
    })
    .from(deals)
    .innerJoin(clients, eq(deals.clientId, clients.id));
  const rows = stage
    ? await base.where(eq(deals.stage, stage)).orderBy(desc(deals.updatedAt))
    : await base.orderBy(desc(deals.updatedAt));
  return rows.map((r) => ({
    ...r.deal,
    clientName: r.clientName,
    company: r.company,
  }));
}

export async function getDeal(id: string, dbc: DbClient = db) {
  const [deal] = await dbc.select().from(deals).where(eq(deals.id, id));
  return deal ?? null;
}

export async function createDeal(input: DealInput, dbc: DbClient = db) {
  const [row] = await dbc
    .insert(deals)
    .values({
      title: input.title,
      clientId: input.clientId,
      valueCents: input.valueCents,
      stage: input.stage,
      probability: input.probability,
      expectedCloseDate: input.expectedCloseDate
        ? new Date(input.expectedCloseDate)
        : null,
      notes: input.notes || null,
    })
    .returning();
  return row;
}

export async function moveDeal(
  dealId: string,
  stage: DealStage,
  dbc: DbClient = db
) {
  const [row] = await dbc
    .update(deals)
    .set({ stage, updatedAt: new Date() })
    .where(eq(deals.id, dealId))
    .returning();
  return row ?? null;
}

export async function deleteDeal(id: string, dbc: DbClient = db) {
  await dbc.delete(deals).where(eq(deals.id, id));
}

export async function touchDealActivity(
  dealId: string,
  at: Date = new Date(),
  dbc: DbClient = db
) {
  await dbc
    .update(deals)
    .set({ lastActivityAt: at, updatedAt: new Date() })
    .where(eq(deals.id, dealId));
}

/** Open (proposal/negotiation) deals flagged by the at-risk detector, ranked. */
export async function listAtRiskDeals(
  now: Date = new Date(),
  dbc: DbClient = db
): Promise<AtRiskDeal[]> {
  const open = await dbc
    .select({ deal: deals, clientName: clients.name })
    .from(deals)
    .innerJoin(clients, eq(deals.clientId, clients.id))
    .where(inArray(deals.stage, ["proposal", "negotiation"]));

  const flagged: AtRiskDeal[] = [];
  for (const { deal, clientName } of open) {
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
    if (risk.atRisk) {
      flagged.push({
        id: deal.id,
        title: deal.title,
        stage: deal.stage,
        expectedCloseDate: deal.expectedCloseDate,
        lastActivityAt: deal.lastActivityAt,
        createdAt: deal.createdAt,
        clientName,
        valueCents: deal.valueCents,
        risk,
      });
    }
  }
  return rankAtRisk(flagged);
}

export async function pipelineTotals(dbc: DbClient = db) {
  const all = await dbc.select().from(deals);
  const byStage = Object.fromEntries(
    STAGES.map((s) => [s.id, { count: 0, valueCents: 0 }])
  ) as Record<DealStage, { count: number; valueCents: number }>;
  for (const d of all) {
    byStage[d.stage].count += 1;
    if (d.stage !== "lost") byStage[d.stage].valueCents += d.valueCents;
  }
  const won = all.filter((d) => d.stage === "won");
  const lost = all.filter((d) => d.stage === "lost");
  return {
    byStage,
    openValueCents: (["lead", "proposal", "negotiation"] as DealStage[]).reduce(
      (s, st) => s + byStage[st].valueCents,
      0
    ),
    wonValueCents: won.reduce((s, d) => s + d.valueCents, 0),
    lostValueCents: lost.reduce((s, d) => s + d.valueCents, 0),
    wonCount: won.length,
    lostCount: lost.length,
    winRate:
      won.length + lost.length > 0
        ? Math.round((won.length / (won.length + lost.length)) * 100)
        : 0,
  };
}
