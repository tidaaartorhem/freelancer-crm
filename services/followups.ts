import { asc, eq, isNull } from "drizzle-orm";
import { clients, deals, followups } from "@/db/schema";
import { db, type DbClient } from "@/lib/db";
import type { FollowupInput } from "@/lib/validations";

export async function listFollowups(
  opts: { onlyOpen?: boolean } = {},
  dbc: DbClient = db
) {
  const rows = await dbc
    .select({
      followup: followups,
      dealTitle: deals.title,
      clientName: clients.name,
    })
    .from(followups)
    .leftJoin(deals, eq(followups.dealId, deals.id))
    .leftJoin(clients, eq(followups.clientId, clients.id))
    .orderBy(asc(followups.dueDate));
  const mapped = rows.map((r) => ({
    ...r.followup,
    dealTitle: r.dealTitle,
    clientName: r.clientName,
  }));
  return opts.onlyOpen ? mapped.filter((f) => !f.completedAt) : mapped;
}

export async function createFollowup(input: FollowupInput, dbc: DbClient = db) {
  const [row] = await dbc
    .insert(followups)
    .values({
      dealId: input.dealId || null,
      clientId: input.clientId || null,
      title: input.title,
      dueDate: new Date(input.dueDate),
      notes: input.notes || null,
    })
    .returning();
  return row;
}

export async function completeFollowup(id: string, dbc: DbClient = db) {
  const [row] = await dbc
    .update(followups)
    .set({ completedAt: new Date() })
    .where(eq(followups.id, id))
    .returning();
  return row ?? null;
}

export async function deleteFollowup(id: string, dbc: DbClient = db) {
  await dbc.delete(followups).where(eq(followups.id, id));
}

export async function openFollowupCount(dbc: DbClient = db): Promise<number> {
  const rows = await dbc
    .select({ id: followups.id })
    .from(followups)
    .where(isNull(followups.completedAt));
  return rows.length;
}
