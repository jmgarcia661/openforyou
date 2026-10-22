import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { addMonths, formatDatePt, periodEndIso } from "@/lib/subscription";

const asSub = (value: unknown) => value as Stripe.Subscription;

describe("periodEndIso", () => {
  it("lê o fim do período dos itens (API nova)", () => {
    const sub = asSub({ items: { data: [{ current_period_end: 1_800_000_000 }] } });
    expect(periodEndIso(sub)).toBe(new Date(1_800_000_000 * 1000).toISOString());
  });
  it("lê do objeto da subscrição (API antiga)", () => {
    const sub = asSub({ items: { data: [{}] }, current_period_end: 1_700_000_000 });
    expect(periodEndIso(sub)).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });
  it("devolve null se não houver data", () => {
    expect(periodEndIso(asSub({ items: { data: [] } }))).toBeNull();
  });
});

describe("addMonths", () => {
  it("soma um mês", () => {
    expect(addMonths(new Date("2026-10-22T10:00:00Z")).toISOString()).toBe("2026-11-22T10:00:00.000Z");
  });
  it("não salta de mês no fim do mês", () => {
    expect(addMonths(new Date("2027-01-31T10:00:00Z")).toISOString()).toBe("2027-02-28T10:00:00.000Z");
  });
  it("passa de dezembro para janeiro", () => {
    expect(addMonths(new Date("2026-12-15T10:00:00Z")).toISOString()).toBe("2027-01-15T10:00:00.000Z");
  });
});

describe("formatDatePt", () => {
  it("formata a data em português", () => {
    expect(formatDatePt("2026-11-22T12:00:00Z")).toContain("novembro");
  });
});
