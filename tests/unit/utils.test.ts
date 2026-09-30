import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, formatRelative, isOverdue } from "@/lib/format";
import { MockProvider } from "@/services/ai";

describe("formatMoney", () => {
  it("formats cents as dollars with no decimals", () => {
    expect(formatMoney(480000)).toBe("$4,800");
    expect(formatMoney(1800000)).toBe("$18,000");
    expect(formatMoney(0)).toBe("$0");
  });
});

describe("isOverdue", () => {
  it("treats yesterday as overdue and tomorrow as not", () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const tomorrow = new Date(Date.now() + 86_400_000);
    expect(isOverdue(yesterday)).toBe(true);
    expect(isOverdue(tomorrow)).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});

describe("formatRelative", () => {
  it("describes today, tomorrow, and days ago", () => {
    expect(formatRelative(new Date())).toBe("today");
    expect(formatRelative(new Date(Date.now() + 86_400_000))).toBe("tomorrow");
    expect(formatRelative(new Date(Date.now() - 3 * 86_400_000))).toBe("3 days ago");
    expect(formatRelative(null)).toBe("never");
  });
});

describe("formatDate", () => {
  it("formats a date and handles null", () => {
    expect(formatDate(new Date("2026-10-05T00:00:00Z"))).toContain("Oct");
    expect(formatDate(null)).toBe("—");
  });
});

describe("MockProvider", () => {
  it("drafts a personalized follow-up with zero API keys", async () => {
    const provider = new MockProvider();
    const draft = await provider.draftFollowUp({
      dealTitle: "Website redesign",
      clientName: "Maya Chen",
      company: "Brightline Studio",
      dealValue: "$4,800",
      stage: "proposal",
      daysSinceActivity: 12,
      riskReasons: ["No activity in 12 days"],
      lastActivitySummary: "Proposal sent.",
    });
    expect(draft.subject).toContain("Website redesign");
    expect(draft.body).toContain("Maya");
    expect(draft.body.length).toBeGreaterThan(50);
  });

  it("handles missing optional context gracefully", async () => {
    const provider = new MockProvider();
    const draft = await provider.draftFollowUp({
      dealTitle: "Audit",
      clientName: "Jonas Weber",
      dealValue: "$1,000",
      stage: "negotiation",
      daysSinceActivity: 8,
      riskReasons: [],
      lastActivitySummary: null,
    });
    expect(draft.subject).toBeTruthy();
    expect(draft.body).toBeTruthy();
  });
});
