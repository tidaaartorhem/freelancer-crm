import { describe, expect, it } from "vitest";
import { detectAtRisk, rankAtRisk, type AtRiskDeal } from "@/lib/at-risk";

const NOW = new Date("2026-09-30T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

function deal(overrides: Partial<Parameters<typeof detectAtRisk>[0]> = {}) {
  return {
    id: "deal-1",
    title: "Website redesign",
    stage: "proposal" as const,
    expectedCloseDate: null,
    lastActivityAt: daysAgo(2),
    createdAt: daysAgo(10),
    ...overrides,
  };
}

describe("detectAtRisk", () => {
  it("ignores leads — too early to be at risk", () => {
    const r = detectAtRisk(deal({ stage: "lead", lastActivityAt: daysAgo(30) }), NOW);
    expect(r.atRisk).toBe(false);
    expect(r.reasons).toHaveLength(0);
  });

  it("ignores won and lost deals", () => {
    for (const stage of ["won", "lost"] as const) {
      const r = detectAtRisk(deal({ stage, lastActivityAt: daysAgo(60) }), NOW);
      expect(r.atRisk).toBe(false);
    }
  });

  it("is healthy when there is recent activity", () => {
    const r = detectAtRisk(deal({ lastActivityAt: daysAgo(2) }), NOW);
    expect(r.atRisk).toBe(false);
  });

  it("flags proposals with no activity in 7+ days", () => {
    const r = detectAtRisk(deal({ lastActivityAt: daysAgo(12) }), NOW);
    expect(r.atRisk).toBe(true);
    expect(r.reasons.some((x) => x.includes("No activity in 12 days"))).toBe(true);
  });

  it("flags deals past their expected close date", () => {
    const r = detectAtRisk(
      deal({ lastActivityAt: daysAgo(1), expectedCloseDate: daysAgo(4) }),
      NOW
    );
    expect(r.atRisk).toBe(true);
    expect(r.reasons.some((x) => x.includes("Expected close date passed"))).toBe(true);
  });

  it("does not flag a future close date", () => {
    const r = detectAtRisk(
      deal({
        lastActivityAt: daysAgo(1),
        expectedCloseDate: new Date(NOW.getTime() + 5 * 86_400_000),
      }),
      NOW
    );
    expect(r.atRisk).toBe(false);
  });

  it("falls back to createdAt when there is no activity", () => {
    const r = detectAtRisk(
      deal({ lastActivityAt: null, createdAt: daysAgo(20) }),
      NOW
    );
    expect(r.atRisk).toBe(true);
  });

  it("flags long-sitting proposals without momentum", () => {
    const r = detectAtRisk(
      deal({ lastActivityAt: daysAgo(16), createdAt: daysAgo(30) }),
      NOW
    );
    expect(r.reasons.some((x) => x.includes("Proposal sitting"))).toBe(true);
  });
});

describe("rankAtRisk", () => {
  it("orders by number of risk reasons, then deal value", () => {
    const mk = (
      id: string,
      reasons: number,
      valueCents: number
    ): AtRiskDeal => ({
      id,
      title: id,
      stage: "proposal",
      expectedCloseDate: null,
      lastActivityAt: daysAgo(10),
      createdAt: daysAgo(20),
      clientName: "Client",
      valueCents,
      risk: { atRisk: true, reasons: Array(reasons).fill("risk") },
    });
    const ranked = rankAtRisk([
      mk("low-value-many-reasons", 2, 100000),
      mk("high-value-few-reasons", 1, 900000),
      mk("high-value-many-reasons", 2, 900000),
    ]);
    expect(ranked.map((d) => d.id)).toEqual([
      "high-value-many-reasons",
      "low-value-many-reasons",
      "high-value-few-reasons",
    ]);
  });
});
