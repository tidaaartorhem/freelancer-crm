import { z } from "zod";

export const dealStages = ["lead", "proposal", "negotiation", "won", "lost"] as const;
export const activityTypes = ["note", "email", "call", "meeting"] as const;
export const invoiceStatuses = ["draft", "sent", "paid", "overdue"] as const;

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  company: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  tags: z.array(z.string().max(40)).max(10).default([]),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const dealSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  clientId: z.string().min(1, "Client is required"),
  valueCents: z.coerce.number().int().min(0, "Value can't be negative").max(100_000_000_00),
  stage: z.enum(dealStages).default("lead"),
  probability: z.coerce.number().int().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type DealInput = z.infer<typeof dealSchema>;

export const moveDealSchema = z.object({
  dealId: z.string().min(1),
  stage: z.enum(dealStages),
});

export const activitySchema = z.object({
  clientId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
  type: z.enum(activityTypes).default("note"),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().max(4000).optional().or(z.literal("")),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const followupSchema = z.object({
  dealId: z.string().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(200),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type FollowupInput = z.infer<typeof followupSchema>;

export const invoiceSchema = z.object({
  dealId: z.string().optional().or(z.literal("")),
  clientId: z.string().min(1, "Client is required"),
  number: z.string().min(1, "Invoice number is required").max(40),
  amountCents: z.coerce.number().int().min(1, "Amount must be at least 1 cent"),
  status: z.enum(invoiceStatuses).default("draft"),
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
