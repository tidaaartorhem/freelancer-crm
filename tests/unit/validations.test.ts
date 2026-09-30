import { describe, expect, it } from "vitest";
import {
  clientSchema,
  dealSchema,
  followupSchema,
  invoiceSchema,
} from "@/lib/validations";

describe("clientSchema", () => {
  it("accepts a valid client", () => {
    const parsed = clientSchema.parse({
      name: "Maya Chen",
      email: "maya@brightline.co",
      company: "Brightline",
      tags: ["agency"],
    });
    expect(parsed.name).toBe("Maya Chen");
  });

  it("rejects an invalid email", () => {
    expect(() =>
      clientSchema.parse({ name: "Maya", email: "not-an-email", tags: [] })
    ).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() =>
      clientSchema.parse({ name: "", email: "a@b.co", tags: [] })
    ).toThrow();
  });

  it("defaults tags to an empty array", () => {
    const parsed = clientSchema.parse({ name: "Maya", email: "a@b.co" });
    expect(parsed.tags).toEqual([]);
  });
});

describe("dealSchema", () => {
  const base = { title: "Redesign", clientId: "client-1", valueCents: 5000 };

  it("applies stage and probability defaults", () => {
    const parsed = dealSchema.parse(base);
    expect(parsed.stage).toBe("lead");
    expect(parsed.probability).toBe(50);
  });

  it("rejects negative value", () => {
    expect(() => dealSchema.parse({ ...base, valueCents: -100 })).toThrow();
  });

  it("rejects probability above 100", () => {
    expect(() => dealSchema.parse({ ...base, probability: 120 })).toThrow();
  });

  it("rejects an unknown stage", () => {
    expect(() => dealSchema.parse({ ...base, stage: "maybe" })).toThrow();
  });

  it("coerces string numbers from form inputs", () => {
    const parsed = dealSchema.parse({
      ...base,
      valueCents: "7500",
      probability: "70",
    });
    expect(parsed.valueCents).toBe(7500);
    expect(parsed.probability).toBe(70);
  });
});

describe("followupSchema", () => {
  it("requires a title and due date", () => {
    expect(() =>
      followupSchema.parse({ title: "", dueDate: "" })
    ).toThrow();
    expect(() =>
      followupSchema.parse({ title: "Call Maya", dueDate: "2026-10-05" })
    ).not.toThrow();
  });
});

describe("invoiceSchema", () => {
  it("rejects zero amounts", () => {
    expect(() =>
      invoiceSchema.parse({
        clientId: "c1",
        number: "INV-1",
        amountCents: 0,
      })
    ).toThrow();
  });

  it("defaults status to draft", () => {
    const parsed = invoiceSchema.parse({
      clientId: "c1",
      number: "INV-1",
      amountCents: 100,
    });
    expect(parsed.status).toBe("draft");
  });
});
