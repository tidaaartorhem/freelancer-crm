import { desc, eq } from "drizzle-orm";
import { activities } from "@/db/schema";
import { db, type DbClient } from "@/lib/db";
import type { ActivityInput } from "@/lib/validations";
import { touchDealActivity } from "./deals";

export async function logActivity(input: ActivityInput, dbc: DbClient = db) {
  const [row] = await dbc
    .insert(activities)
    .values({
      clientId: input.clientId || null,
      dealId: input.dealId || null,
      type: input.type,
      subject: input.subject,
      body: input.body || null,
    })
    .returning();
  if (input.dealId) await touchDealActivity(input.dealId, new Date(), dbc);
  return row;
}

export async function listDealActivities(dealId: string, dbc: DbClient = db) {
  return dbc
    .select()
    .from(activities)
    .where(eq(activities.dealId, dealId))
    .orderBy(desc(activities.occurredAt));
}
