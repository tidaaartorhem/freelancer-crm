import type { DealStage } from "@/db/schema";

export interface AtRiskInput {
  id: string;
  title: string;
  stage: DealStage;
  expectedCloseDate: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
}

export interface AtRiskResult {
  atRisk: boolean;
  reasons: string[];
}

const DAY_MS = 86_400_000;
const STALE_AFTER_DAYS = 7;
const PROPOSAL_STALE_AFTER_DAYS = 14;

/**
 * Pure, deterministic at-risk detection for open deals.
 * A deal is only evaluated in proposal/negotiation — leads are too early
 * and won/lost are terminal.
 */
export function detectAtRisk(
  deal: AtRiskInput,
  now: Date = new Date()
): AtRiskResult {
  const reasons: string[] = [];

  if (deal.stage !== "proposal" && deal.stage !== "negotiation") {
    return { atRisk: false, reasons };
  }

  const reference = deal.lastActivityAt ?? deal.createdAt;
  const daysSinceActivity = Math.floor(
    (now.getTime() - reference.getTime()) / DAY_MS
  );

  if (daysSinceActivity >= STALE_AFTER_DAYS) {
    reasons.push(
      `No activity in ${daysSinceActivity} days (last: ${reference.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
    );
  }

  if (deal.expectedCloseDate && deal.expectedCloseDate < now) {
    const overdueBy = Math.max(
      1,
      Math.floor((now.getTime() - deal.expectedCloseDate.getTime()) / DAY_MS)
    );
    reasons.push(
      `Expected close date passed ${overdueBy} day${overdueBy === 1 ? "" : "s"} ago`
    );
  }

  if (deal.stage === "proposal") {
    const daysInProposal = Math.floor(
      (now.getTime() - deal.createdAt.getTime()) / DAY_MS
    );
    if (daysInProposal >= PROPOSAL_STALE_AFTER_DAYS && daysSinceActivity >= STALE_AFTER_DAYS) {
      reasons.push(
        `Proposal sitting for ${daysInProposal} days without momentum`
      );
    }
  }

  return { atRisk: reasons.length > 0, reasons };
}

export interface AtRiskDeal extends AtRiskInput {
  clientName: string;
  valueCents: number;
  risk: AtRiskResult;
}

export function rankAtRisk(deals: AtRiskDeal[]): AtRiskDeal[] {
  return [...deals].sort((a, b) => {
    if (b.risk.reasons.length !== a.risk.reasons.length) {
      return b.risk.reasons.length - a.risk.reasons.length;
    }
    return b.valueCents - a.valueCents;
  });
}
