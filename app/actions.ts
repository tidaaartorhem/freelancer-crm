"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  activitySchema,
  clientSchema,
  dealSchema,
  followupSchema,
  invoiceSchema,
  moveDealSchema,
} from "@/lib/validations";
import {
  createClient,
  deleteClient,
  updateClient,
} from "@/services/clients";
import {
  createDeal,
  deleteDeal,
  moveDeal,
} from "@/services/deals";
import { logActivity } from "@/services/activities";
import {
  completeFollowup,
  createFollowup,
  deleteFollowup,
} from "@/services/followups";
import {
  createInvoice,
  deleteInvoice,
  setInvoiceStatus,
} from "@/services/invoices";
import {
  approveDraft,
  deleteDraft,
  generateDraftForDeal,
  markDraftSent,
  rejectDraft,
} from "@/services/drafts";

type ActionResult = { ok: true } | { ok: false; error: string };

function fail(e: unknown): ActionResult {
  if (e instanceof z.ZodError) {
    return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
  }
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
}

function revalidate(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

// ---------- Clients ----------

export async function createClientAction(
  input: unknown
): Promise<ActionResult & { id?: string }> {
  try {
    const parsed = clientSchema.parse(input);
    const row = await createClient(parsed);
    revalidate(["/clients", "/"]);
    return { ok: true, id: row.id };
  } catch (e) {
    return fail(e);
  }
}

export async function updateClientAction(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const parsed = clientSchema.parse(input);
    await updateClient(id, parsed);
    revalidate(["/clients", `/clients/${id}`, "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteClientAction(id: string): Promise<ActionResult> {
  try {
    await deleteClient(id);
    revalidate(["/clients", "/deals", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Deals ----------

export async function createDealAction(
  input: unknown
): Promise<ActionResult & { id?: string }> {
  try {
    const parsed = dealSchema.parse(input);
    const row = await createDeal(parsed);
    revalidate(["/deals", "/", "/assistant"]);
    return { ok: true, id: row.id };
  } catch (e) {
    return fail(e);
  }
}

export async function moveDealAction(
  dealId: string,
  stage: unknown
): Promise<ActionResult> {
  try {
    const parsed = moveDealSchema.parse({ dealId, stage });
    await moveDeal(parsed.dealId, parsed.stage);
    revalidate(["/deals", "/", "/assistant"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDealAction(id: string): Promise<ActionResult> {
  try {
    await deleteDeal(id);
    revalidate(["/deals", "/", "/assistant"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Activities ----------

export async function logActivityAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = activitySchema.parse(input);
    await logActivity(parsed);
    revalidate(["/clients", "/deals"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Follow-ups ----------

export async function createFollowupAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const parsed = followupSchema.parse(input);
    await createFollowup(parsed);
    revalidate(["/followups", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function completeFollowupAction(id: string): Promise<ActionResult> {
  try {
    await completeFollowup(id);
    revalidate(["/followups", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFollowupAction(id: string): Promise<ActionResult> {
  try {
    await deleteFollowup(id);
    revalidate(["/followups", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Invoices ----------

export async function createInvoiceAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const parsed = invoiceSchema.parse(input);
    await createInvoice(parsed);
    revalidate(["/invoices", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setInvoiceStatusAction(
  id: string,
  status: "draft" | "sent" | "paid" | "overdue"
): Promise<ActionResult> {
  try {
    await setInvoiceStatus(id, status);
    revalidate(["/invoices", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  try {
    await deleteInvoice(id);
    revalidate(["/invoices", "/"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- AI drafts (approval queue) ----------

export async function generateDraftAction(
  dealId: string
): Promise<ActionResult & { draftId?: string }> {
  try {
    const { draft } = await generateDraftForDeal(dealId);
    revalidate(["/assistant"]);
    return { ok: true, draftId: draft.id };
  } catch (e) {
    return fail(e);
  }
}

export async function approveDraftAction(id: string): Promise<ActionResult> {
  try {
    await approveDraft(id);
    revalidate(["/assistant"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectDraftAction(id: string): Promise<ActionResult> {
  try {
    await rejectDraft(id);
    revalidate(["/assistant"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markDraftSentAction(id: string): Promise<ActionResult> {
  try {
    await markDraftSent(id);
    revalidate(["/assistant"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDraftAction(id: string): Promise<ActionResult> {
  try {
    await deleteDraft(id);
    revalidate(["/assistant"]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
