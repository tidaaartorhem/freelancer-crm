import { desc, eq, like, or } from "drizzle-orm";
import { activities, clients, deals, type Client } from "@/db/schema";
import { db, type DbClient } from "@/lib/db";
import type { ClientInput } from "@/lib/validations";

export async function listClients(
  search?: string,
  dbc: DbClient = db
): Promise<Client[]> {
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    return dbc
      .select()
      .from(clients)
      .where(
        or(like(clients.name, q), like(clients.company, q), like(clients.email, q))
      )
      .orderBy(desc(clients.updatedAt));
  }
  return dbc.select().from(clients).orderBy(desc(clients.updatedAt));
}

export async function getClient(id: string, dbc: DbClient = db) {
  const [client] = await dbc.select().from(clients).where(eq(clients.id, id));
  if (!client) return null;
  const clientDeals = await dbc
    .select()
    .from(deals)
    .where(eq(deals.clientId, id))
    .orderBy(desc(deals.updatedAt));
  const timeline = await dbc
    .select()
    .from(activities)
    .where(eq(activities.clientId, id))
    .orderBy(desc(activities.occurredAt));
  return { client, deals: clientDeals, timeline };
}

export async function createClient(input: ClientInput, dbc: DbClient = db) {
  const [row] = await dbc
    .insert(clients)
    .values({
      name: input.name,
      email: input.email,
      company: input.company || null,
      phone: input.phone || null,
      website: input.website || null,
      notes: input.notes || null,
      tags: input.tags,
    })
    .returning();
  return row;
}

export async function updateClient(
  id: string,
  input: ClientInput,
  dbc: DbClient = db
) {
  const [row] = await dbc
    .update(clients)
    .set({
      name: input.name,
      email: input.email,
      company: input.company || null,
      phone: input.phone || null,
      website: input.website || null,
      notes: input.notes || null,
      tags: input.tags,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning();
  return row ?? null;
}

export async function deleteClient(id: string, dbc: DbClient = db) {
  await dbc.delete(clients).where(eq(clients.id, id));
}
