# Freelancer CRM

**Freelancers run their client pipeline across scattered spreadsheets — and lose deals to slow, forgotten follow-up.** Freelancer CRM is a CRM built for freelancers: one pipeline for every deal, every client conversation in one timeline, and an AI pipeline assistant that flags at-risk deals and drafts follow-ups before they go cold.

## The 5-minute demo

```bash
npm install
cp .env.example .env   # optional — the AI assistant works with zero keys
npm run db:setup       # generate schema, migrate, seed demo data
npm run dev            # open http://localhost:3000
```

Try this:

1. **Dashboard** — pipeline value by stage, at-risk deals, follow-ups due, won/lost revenue.
2. **Pipeline** — drag a deal from Lead to Proposal. At-risk deals carry a red flag.
3. **AI Assistant** — pick an at-risk deal (e.g. *Online ordering site*), click **Draft follow-up**. The AI writes a personalized email; it lands in the **approval queue** as *pending*. Approve it, then mark it sent. Nothing is ever sent automatically.
4. **Clients** — open a client to see their deals and full activity timeline.
5. **Invoices** — create an invoice from a won deal, mark it sent, then paid.

Seeded data: 8 clients, 15 deals across all stages (3 flagged at-risk), 16 activities, 5 follow-ups, 3 invoices.

## Features

- **Dashboard** — open pipeline value, at-risk count, revenue won, outstanding invoices; pipeline-by-stage bar chart and win/loss donut (Recharts).
- **Deals pipeline** — kanban board (Lead → Proposal → Negotiation → Won/Lost) with drag-and-drop (incl. keyboard dragging), deal value, probability, expected close date, linked client.
- **AI pipeline assistant** — deterministic at-risk detection (stale activity, passed close dates, stalled proposals) plus AI-drafted follow-up emails. Human **approval queue**: drafts are pending until you approve them; only approved drafts can be marked sent.
- **Clients** — full CRUD, contact info, tags, per-client activity timeline, linked deals.
- **Follow-ups & reminders** — due dates with overdue highlighting, completion tracking.
- **Invoices (light)** — create from a won deal or manually, mark sent/paid, overdue detection (one shared date-based rule: a sent invoice past its due date — the dashboard stat and the invoices page badge always agree).
- **Reset demo data** — one click in the sidebar (or the mobile header) wipes the demo workspace and re-seeds it with dates anchored to today, so the demo never goes stale. Confirms first; anything you changed in the demo is lost.

## Architecture

```
Browser (React Server Components + client islands)
  └─ Server Actions (app/actions.ts) — validated with Zod
       └─ Services (/services) — clients, deals, activities, followups, invoices, drafts, ai
            ├─ lib/at-risk.ts — pure, deterministic at-risk detection (unit-tested)
            ├─ services/ai.ts — provider abstraction: Mock | OpenAI | Anthropic
            └─ Drizzle ORM → SQLite (better-sqlite3) locally, Postgres path documented
```

**AI provider abstraction** (`services/ai.ts`): the pipeline assistant talks to an `AIProvider` interface. `MockProvider` is the default — template-based drafting that works with zero API keys. Set `AI_PROVIDER=openai` (or `anthropic`) with the matching key to use a real free-tier model (`AI_MODEL` optional override). The at-risk *detection* itself is rule-based and deterministic, so the "which deals need attention" logic is always explainable and testable; the model only drafts the email copy.

**Approval queue pattern**: `services/drafts.ts` enforces the invariant — `markDraftSent` throws unless the draft is `approved`. The UI mirrors it: pending → approve/reject → approved → mark as sent → history.

## Environment setup

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | No | Defaults to `file:./dev.db` (SQLite). Set a `postgres://` URL for Postgres (see below). |
| `AI_PROVIDER` | No | `mock` (default), `openai`, or `anthropic`. |
| `AI_MODEL` | No | Override the default model per provider. |
| `OPENAI_API_KEY` | Only for `openai` | Any free-tier key works. |
| `ANTHROPIC_API_KEY` | Only for `anthropic` | Any free-tier key works. |

## Database

Local dev uses SQLite via better-sqlite3 — no external services, no setup beyond `npm run db:setup`.

**Postgres swap path** (production): all data access lives in `/services` behind the `db` export in `lib/db.ts`. Swap that module for a postgres-js driver:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export const db = drizzle(postgres(process.env.DATABASE_URL!), { schema });
```

then generate Postgres migrations with `drizzle-kit generate --dialect=postgresql`. No service or UI code changes needed.

Useful scripts: `npm run db:generate` (new migration), `npm run db:migrate`, `npm run db:seed` (reset + reseed demo data).

## Tests

```bash
npm test            # vitest: unit + integration (53 tests)
npm run test:e2e    # Playwright: primary journey
                    #   client → deal → drag through pipeline →
                    #   AI flags at-risk → draft → approve → sent
npx tsc --noEmit    # strict typecheck
npm run build       # production build
```

Integration tests run against isolated temp SQLite databases (see `tests/integration/setup.ts`) — they never touch `dev.db`. The E2E spec runs against the dev server with seeded data and creates one client + one deal; re-run `npm run db:seed` afterwards to restore pristine demo data.

## Project structure

```
/app            Next.js App Router pages + server actions
/components     UI design system (/ui) + feature components
/db             Drizzle schema, migrations, seed script
/lib            validations (Zod), at-risk detection, formatting, db client
/services       data access + AI provider abstraction
/types          (shared types live beside their domains)
/hooks          (client hooks as needed)
/tests          unit, integration, e2e
/public         static assets
```

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn-style components · Lucide icons · Recharts · React Hook Form + Zod · Drizzle ORM + better-sqlite3 · Vitest · Playwright · @dnd-kit
