import { describe, expect, it } from "vitest";
import { isInvoiceOverdue } from "@/lib/format";

const NOW = new Date(2026, 9, 20, 12, 0, 0); // Oct 20, 2026 (local)
const past = new Date(2026, 9, 10); // Oct 10
const future = new Date(2026, 9, 30); // Oct 30
const today = new Date(2026, 9, 20, 8, 0, 0); // Oct 20, earlier same day

describe("isInvoiceOverdue", () => {
  it("flags a sent invoice past its due date", () => {
    expect(isInvoiceOverdue("sent", past, NOW)).toBe(true);
  });

  it("does not flag a sent invoice due in the future", () => {
    expect(isInvoiceOverdue("sent", future, NOW)).toBe(false);
  });

  it("does not flag a sent invoice due earlier today", () => {
    expect(isInvoiceOverdue("sent", today, NOW)).toBe(false);
  });

  it("does not flag a draft invoice past its due date", () => {
    expect(isInvoiceOverdue("draft", past, NOW)).toBe(false);
  });

  it("does not flag a paid invoice past its due date", () => {
    expect(isInvoiceOverdue("paid", past, NOW)).toBe(false);
  });

  it("treats the legacy 'overdue' status like sent", () => {
    expect(isInvoiceOverdue("overdue", past, NOW)).toBe(true);
    expect(isInvoiceOverdue("overdue", future, NOW)).toBe(false);
  });

  it("does not flag a sent invoice with no due date", () => {
    expect(isInvoiceOverdue("sent", null, NOW)).toBe(false);
    expect(isInvoiceOverdue("sent", undefined, NOW)).toBe(false);
  });

  it("accepts ISO date strings", () => {
    expect(isInvoiceOverdue("sent", "2026-10-10", NOW)).toBe(true);
    expect(isInvoiceOverdue("sent", "2026-10-30", NOW)).toBe(false);
  });
});
