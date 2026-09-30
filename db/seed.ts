import { addDays, startOfDay, subDays } from "date-fns";
import { db } from "../lib/db";
import {
  activities,
  clients,
  deals,
  drafts,
  followups,
  invoices,
} from "./schema";

const DAY_MS = 86_400_000;

function at(base: Date, dayOffset: number, h = 9, m = 0): Date {
  const d = new Date(base.getTime() + dayOffset * DAY_MS);
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const today = startOfDay(new Date());
  console.log("Seeding Freelancer CRM demo data...");

  // Clear existing (FK-safe order)
  await db.delete(drafts);
  await db.delete(invoices);
  await db.delete(followups);
  await db.delete(activities);
  await db.delete(deals);
  await db.delete(clients);

  const [maya, jonas, priya, tom, sofia, david, amara, lena] = await db
    .insert(clients)
    .values([
      {
        name: "Maya Chen",
        email: "maya@brightline.co",
        company: "Brightline Studio",
        phone: "+1 416-555-0132",
        website: "https://brightline.co",
        notes: "Design agency, 12 people. Maya is the founder and decision maker.",
        tags: ["agency", "retainer-prospect"],
      },
      {
        name: "Jonas Weber",
        email: "jonas@weberlogistics.com",
        company: "Weber Logistics",
        phone: "+1 647-555-0187",
        notes: "Mid-size logistics firm. Slow procurement but pays on time.",
        tags: ["logistics", "enterprise-ish"],
      },
      {
        name: "Priya Nair",
        email: "priya@bloomand.co",
        company: "Bloom & Co",
        phone: "+1 416-555-0119",
        website: "https://bloomand.co",
        notes: "DTC skincare brand. Moves fast, wants everything yesterday.",
        tags: ["ecommerce", "fast-mover"],
      },
      {
        name: "Tom Alvarez",
        email: "tom@alvarezfitness.com",
        company: "Alvarez Fitness",
        phone: "+1 905-555-0144",
        notes: "Boutique gym chain, 3 locations. Tom owns all of them.",
        tags: ["fitness", "local"],
      },
      {
        name: "Sofia Rossi",
        email: "sofia@casarossi.it",
        company: "Casa Rossi Restaurants",
        phone: "+1 416-555-0173",
        notes: "Family restaurant group. Sofia handles marketing.",
        tags: ["hospitality"],
      },
      {
        name: "David Kim",
        email: "david@northbeam.io",
        company: "Northbeam",
        phone: "+1 647-555-0121",
        website: "https://northbeam.io",
        notes: "B2B SaaS, Series A. David is head of marketing.",
        tags: ["saas", "startup"],
      },
      {
        name: "Amara Okafor",
        email: "amara@okaforlegal.com",
        company: "Okafor Legal",
        phone: "+1 416-555-0166",
        notes: "Boutique law firm. Very detail-oriented, needs fixed pricing.",
        tags: ["legal"],
      },
      {
        name: "Lena Fischer",
        email: "lena@fischerarch.de",
        company: "Fischer Architecture",
        phone: "+49 170 555 0182",
        notes: "Architecture studio in Berlin. 6h time difference — mind scheduling.",
        tags: ["architecture", "eu"],
      },
    ])
    .returning();

  type DealSeed = {
    key: string;
    title: string;
    client: typeof maya;
    valueCents: number;
    stage: "lead" | "proposal" | "negotiation" | "won" | "lost";
    probability: number;
    createdDaysAgo: number;
    expectedCloseInDays?: number;
    lastActivityDaysAgo?: number;
    notes?: string;
  };

  const dealSeeds: DealSeed[] = [
    // ---- Lead ----
    { key: "d1", title: "Brand identity refresh", client: maya, valueCents: 480000, stage: "lead", probability: 20, createdDaysAgo: 2, notes: "Intro call went well. Waiting on their brand questionnaire." },
    { key: "d2", title: "Website rebuild", client: jonas, valueCents: 1200000, stage: "lead", probability: 25, createdDaysAgo: 5, notes: "Legacy WordPress site. Needs discovery before scoping." },
    { key: "d3", title: "Email automation setup", client: priya, valueCents: 240000, stage: "lead", probability: 30, createdDaysAgo: 1, notes: "Klaviyo flows for abandoned cart + post-purchase." },
    // ---- Proposal ----
    { key: "d4", title: "Booking platform", client: tom, valueCents: 850000, stage: "proposal", probability: 60, createdDaysAgo: 8, lastActivityDaysAgo: 3, expectedCloseInDays: 12, notes: "Proposal sent. Tom reviewing with his ops manager." },
    { key: "d5", title: "Online ordering site", client: sofia, valueCents: 620000, stage: "proposal", probability: 55, createdDaysAgo: 16, lastActivityDaysAgo: 12, expectedCloseInDays: 6, notes: "AT-RISK seed: proposal sent 12 days ago, no reply since." },
    { key: "d6", title: "Marketing site redesign", client: david, valueCents: 1500000, stage: "proposal", probability: 65, createdDaysAgo: 6, lastActivityDaysAgo: 2, expectedCloseInDays: 14, notes: "Proposal sent. David asked about timeline compression." },
    { key: "d7", title: "Client portal", client: amara, valueCents: 980000, stage: "proposal", probability: 50, createdDaysAgo: 14, lastActivityDaysAgo: 9, expectedCloseInDays: 9, notes: "AT-RISK seed: follow-up overdue, Amara asked for fixed pricing." },
    // ---- Negotiation ----
    { key: "d8", title: "Portfolio site + CMS", client: lena, valueCents: 1100000, stage: "negotiation", probability: 80, createdDaysAgo: 21, lastActivityDaysAgo: 1, expectedCloseInDays: 5, notes: "Final round. Discussing maintenance terms." },
    { key: "d9", title: "Design system retainer", client: maya, valueCents: 360000, stage: "negotiation", probability: 75, createdDaysAgo: 30, lastActivityDaysAgo: 6, expectedCloseInDays: -4, notes: "AT-RISK seed: expected close date passed 4 days ago." },
    { key: "d10", title: "CRO audit", client: priya, valueCents: 550000, stage: "negotiation", probability: 70, createdDaysAgo: 12, lastActivityDaysAgo: 2, expectedCloseInDays: 10, notes: "Negotiating audit depth vs. price." },
    // ---- Won ----
    { key: "d11", title: "Dashboard MVP", client: jonas, valueCents: 1800000, stage: "won", probability: 100, createdDaysAgo: 45, lastActivityDaysAgo: 20, notes: "Delivered. Great reference client." },
    { key: "d12", title: "Menu redesign", client: sofia, valueCents: 320000, stage: "won", probability: 100, createdDaysAgo: 30, lastActivityDaysAgo: 12, notes: "Delivered. Upsell online ordering later." },
    { key: "d13", title: "Landing page sprint", client: david, valueCents: 750000, stage: "won", probability: 100, createdDaysAgo: 18, lastActivityDaysAgo: 6, notes: "Delivered. Invoice drafted." },
    // ---- Lost ----
    { key: "d14", title: "App prototype", client: tom, valueCents: 1000000, stage: "lost", probability: 0, createdDaysAgo: 40, lastActivityDaysAgo: 15, notes: "Lost: decided to build in-house." },
    { key: "d15", title: "Brand refresh", client: lena, valueCents: 500000, stage: "lost", probability: 0, createdDaysAgo: 50, lastActivityDaysAgo: 25, notes: "Lost: budget cut for the year." },
  ];

  const dealIds: Record<string, string> = {};
  for (const s of dealSeeds) {
    const created = at(today, -s.createdDaysAgo);
    const [row] = await db
      .insert(deals)
      .values({
        title: s.title,
        clientId: s.client.id,
        valueCents: s.valueCents,
        stage: s.stage,
        probability: s.probability,
        expectedCloseDate:
          s.expectedCloseInDays !== undefined
            ? at(today, s.expectedCloseInDays)
            : null,
        notes: s.notes,
        lastActivityAt:
          s.lastActivityDaysAgo !== undefined
            ? at(today, -s.lastActivityDaysAgo)
            : created,
        createdAt: created,
        updatedAt: created,
      })
      .returning();
    dealIds[s.key] = row.id;
  }

  // ---- Activities ----
  const activitySeeds: Array<{
    dealKey?: string;
    client: typeof maya;
    type: "note" | "email" | "call" | "meeting";
    subject: string;
    body?: string;
    daysAgo: number;
  }> = [
    { dealKey: "d4", client: tom, type: "email", subject: "Proposal sent", body: "Sent the booking platform proposal ($8,500). Tom said he'll review with his ops manager this week.", daysAgo: 3 },
    { dealKey: "d4", client: tom, type: "call", subject: "Discovery call", body: "45-min call. Needs class scheduling + payments. Timeline: launch before January.", daysAgo: 8 },
    { dealKey: "d5", client: sofia, type: "email", subject: "Proposal sent", body: "Online ordering site proposal sent ($6,200).", daysAgo: 12 },
    { dealKey: "d5", client: sofia, type: "meeting", subject: "Menu walkthrough", body: "Walked through the menu structure at the Danforth location.", daysAgo: 16 },
    { dealKey: "d6", client: david, type: "email", subject: "Re: timeline", body: "David asked if we can compress to 4 weeks. Said yes with a rush fee.", daysAgo: 2 },
    { dealKey: "d7", client: amara, type: "email", subject: "Fixed pricing request", body: "Amara wants fixed pricing, not T&M. Need to re-scope the portal.", daysAgo: 9 },
    { dealKey: "d8", client: lena, type: "call", subject: "Maintenance terms", body: "Agreed on 6-month maintenance. Contract going out this week.", daysAgo: 1 },
    { dealKey: "d9", client: maya, type: "email", subject: "Retainer draft", body: "Sent retainer terms. Maya said she'd sign last week — chasing.", daysAgo: 6 },
    { dealKey: "d10", client: priya, type: "call", subject: "Audit scope", body: "Priya wants the audit to cover checkout specifically.", daysAgo: 2 },
    { dealKey: "d11", client: jonas, type: "meeting", subject: "Handover", body: "Dashboard MVP handed over. Jonas happy, offered a testimonial.", daysAgo: 20 },
    { dealKey: "d1", client: maya, type: "call", subject: "Intro call", body: "Brand refresh intro. Sending questionnaire.", daysAgo: 2 },
    { dealKey: "d2", client: jonas, type: "note", subject: "Site audit notes", body: "Current site: WP 5.x, 40+ plugins, no staging. Rebuild recommended.", daysAgo: 5 },
    { dealKey: "d3", client: priya, type: "email", subject: "Klaviyo access", body: "Priya shared Klaviyo access. 3 flows to build.", daysAgo: 1 },
    { dealKey: "d12", client: sofia, type: "email", subject: "Menu files delivered", body: "Final menu PDFs + print files delivered.", daysAgo: 12 },
    { dealKey: "d13", client: david, type: "meeting", subject: "Sprint retro", body: "Landing page shipped. Conversion up 18% in week one.", daysAgo: 6 },
    { dealKey: "d14", client: tom, type: "email", subject: "Lost — in-house", body: "Tom decided to build the app prototype in-house. Keep the door open.", daysAgo: 15 },
  ];

  for (const a of activitySeeds) {
    await db.insert(activities).values({
      clientId: a.client.id,
      dealId: a.dealKey ? dealIds[a.dealKey] : null,
      type: a.type,
      subject: a.subject,
      body: a.body,
      occurredAt: at(today, -a.daysAgo, 10, 30),
    });
  }

  // ---- Follow-ups ----
  const followupSeeds: Array<{
    dealKey: string;
    title: string;
    dueInDays: number;
    notes?: string;
  }> = [
    { dealKey: "d4", title: "Follow up on booking platform proposal", dueInDays: 1 },
    { dealKey: "d5", title: "Check in on online ordering proposal", dueInDays: -3, notes: "No reply in 12 days — try a different angle." },
    { dealKey: "d7", title: "Send revised fixed-price portal estimate", dueInDays: -1 },
    { dealKey: "d9", title: "Confirm retainer start date with Maya", dueInDays: 2 },
    { dealKey: "d8", title: "Send contract for portfolio site", dueInDays: 4 },
  ];

  for (const f of followupSeeds) {
    const seed = dealSeeds.find((d) => d.key === f.dealKey)!;
    await db.insert(followups).values({
      dealId: dealIds[f.dealKey],
      clientId: seed.client.id,
      title: f.title,
      dueDate: at(today, f.dueInDays),
      notes: f.notes,
    });
  }

  // ---- Invoices ----
  await db.insert(invoices).values([
    {
      number: "INV-2026-001",
      dealId: dealIds["d11"],
      clientId: jonas.id,
      amountCents: 1800000,
      status: "paid",
      issuedAt: at(today, -25),
      dueDate: at(today, -11),
      paidAt: at(today, -13),
      notes: "Dashboard MVP — paid 2 days early.",
    },
    {
      number: "INV-2026-002",
      dealId: dealIds["d12"],
      clientId: sofia.id,
      amountCents: 320000,
      status: "sent",
      issuedAt: at(today, -10),
      dueDate: at(today, 3),
      notes: "Menu redesign.",
    },
    {
      number: "INV-2026-003",
      dealId: dealIds["d13"],
      clientId: david.id,
      amountCents: 750000,
      status: "draft",
      notes: "Landing page sprint — review before sending.",
    },
  ]);

  console.log("Seed complete: 8 clients, 15 deals, activities, 5 follow-ups, 3 invoices.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
