import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const clients = sqliteTable(
  "clients",
  {
    id: pk(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    phone: text("phone"),
    website: text("website"),
    notes: text("notes"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("clients_name_idx").on(t.name)]
);

export type DealStage = "lead" | "proposal" | "negotiation" | "won" | "lost";

export const deals = sqliteTable(
  "deals",
  {
    id: pk(),
    title: text("title").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    valueCents: integer("value_cents").notNull().default(0),
    stage: text("stage").$type<DealStage>().notNull().default("lead"),
    probability: integer("probability").notNull().default(50),
    expectedCloseDate: integer("expected_close_date", { mode: "timestamp" }),
    notes: text("notes"),
    lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("deals_client_idx").on(t.clientId),
    index("deals_stage_idx").on(t.stage),
  ]
);

export type ActivityType = "note" | "email" | "call" | "meeting";

export const activities = sqliteTable(
  "activities",
  {
    id: pk(),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),
    dealId: text("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    type: text("type").$type<ActivityType>().notNull().default("note"),
    subject: text("subject").notNull(),
    body: text("body"),
    occurredAt: integer("occurred_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: createdAt(),
  },
  (t) => [
    index("activities_client_idx").on(t.clientId),
    index("activities_deal_idx").on(t.dealId),
  ]
);

export const followups = sqliteTable(
  "followups",
  {
    id: pk(),
    dealId: text("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("followups_due_idx").on(t.dueDate)]
);

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export const invoices = sqliteTable(
  "invoices",
  {
    id: pk(),
    number: text("number").notNull().unique(),
    dealId: text("deal_id").references(() => deals.id, {
      onDelete: "set null",
    }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").$type<InvoiceStatus>().notNull().default("draft"),
    issuedAt: integer("issued_at", { mode: "timestamp" }),
    dueDate: integer("due_date", { mode: "timestamp" }),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("invoices_client_idx").on(t.clientId)]
);

/**
 * AI-drafted follow-up emails awaiting human review.
 * Nothing is ever sent automatically: a draft must be explicitly
 * approved before it can be marked sent.
 */
export type DraftStatus = "pending" | "approved" | "rejected" | "sent";

export const drafts = sqliteTable(
  "drafts",
  {
    id: pk(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    provider: text("provider").notNull().default("mock"),
    model: text("model"),
    status: text("status").$type<DraftStatus>().notNull().default("pending"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("drafts_deal_idx").on(t.dealId),
    index("drafts_status_idx").on(t.status),
  ]
);

export const clientsRelations = relations(clients, ({ many }) => ({
  deals: many(deals),
  activities: many(activities),
  followups: many(followups),
  invoices: many(invoices),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  client: one(clients, {
    fields: [deals.clientId],
    references: [clients.id],
  }),
  activities: many(activities),
  followups: many(followups),
  drafts: many(drafts),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  client: one(clients, {
    fields: [activities.clientId],
    references: [clients.id],
  }),
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id],
  }),
}));

export const followupsRelations = relations(followups, ({ one }) => ({
  deal: one(deals, {
    fields: [followups.dealId],
    references: [deals.id],
  }),
  client: one(clients, {
    fields: [followups.clientId],
    references: [clients.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  deal: one(deals, {
    fields: [invoices.dealId],
    references: [deals.id],
  }),
}));

export const draftsRelations = relations(drafts, ({ one }) => ({
  deal: one(deals, {
    fields: [drafts.dealId],
    references: [deals.id],
  }),
  client: one(clients, {
    fields: [drafts.clientId],
    references: [clients.id],
  }),
}));

export type Client = typeof clients.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Followup = typeof followups.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
