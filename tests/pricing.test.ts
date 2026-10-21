import { describe, expect, it } from "vitest";
import { DEFAULT_PRICES, formatEUR } from "@/lib/pricing";

const normalize = (s: string) => s.replace(/\s/g, " ");

describe("preços", () => {
  it("usa os valores do briefing por omissão", () => {
    expect(DEFAULT_PRICES).toEqual({ monthlyCents: 5900, firstMonthCents: 3900, ebookCents: 1400 });
  });

  it("formata euros inteiros sem casas decimais", () => {
    expect(normalize(formatEUR(5900))).toBe("59 €");
    expect(normalize(formatEUR(3900))).toBe("39 €");
    expect(normalize(formatEUR(1400))).toBe("14 €");
  });

  it("mostra casas decimais quando necessário", () => {
    expect(normalize(formatEUR(1450))).toBe("14,50 €");
  });

  it("o desconto do primeiro mês é de 20 €", () => {
    expect(DEFAULT_PRICES.monthlyCents - DEFAULT_PRICES.firstMonthCents).toBe(2000);
  });
});
