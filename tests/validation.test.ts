import { describe, expect, it } from "vitest";
import { newsletterSchema } from "@/lib/validation";

const valid = { name: "Ana", email: "ana@example.com", consent: true };

describe("newsletterSchema", () => {
  it("aceita dados válidos", () => {
    expect(newsletterSchema.safeParse(valid).success).toBe(true);
  });

  it("exige consentimento explícito", () => {
    expect(newsletterSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("rejeita email inválido", () => {
    expect(newsletterSchema.safeParse({ ...valid, email: "ana" }).success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    expect(newsletterSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});
