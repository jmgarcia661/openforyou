import { describe, expect, it } from "vitest";
import { isKind, metaLine } from "@/lib/content";
import { contentSchema, weeklySchema } from "@/lib/validation";

describe("metaLine", () => {
  it("junta duração, nível e professor", () => {
    expect(metaLine({ duration_min: 25, level: "Todos os níveis", teacher: "José Maria Garcia" })).toBe(
      "25 min · Todos os níveis · José Maria Garcia",
    );
  });
  it("ignora o que falta", () => {
    expect(metaLine({ duration_min: 8, level: null, teacher: null })).toBe("8 min");
    expect(metaLine({ duration_min: null, level: null, teacher: null })).toBe("");
  });
});

describe("isKind", () => {
  it("só aceita os três tipos", () => {
    expect(isKind("yoga")).toBe(true);
    expect(isKind("sound")).toBe(true);
    expect(isKind("favoritos")).toBe(false);
    expect(isKind(undefined)).toBe(false);
  });
});

describe("contentSchema", () => {
  const valid = { kind: "yoga", title: "Costas e ombros", access: "premium", status: "draft" };
  it("aceita o mínimo", () => {
    expect(contentSchema.safeParse(valid).success).toBe(true);
  });
  it("exige título", () => {
    expect(contentSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });
  it("só aceita minutos numéricos", () => {
    expect(contentSchema.safeParse({ ...valid, duration: "25" }).success).toBe(true);
    expect(contentSchema.safeParse({ ...valid, duration: "vinte" }).success).toBe(false);
  });
});

describe("weeklySchema", () => {
  it("o fim não pode ser antes do início", () => {
    expect(weeklySchema.safeParse({ startsOn: "2026-10-26", endsOn: "2026-11-01" }).success).toBe(true);
    expect(weeklySchema.safeParse({ startsOn: "2026-11-01", endsOn: "2026-10-26" }).success).toBe(false);
  });
});
