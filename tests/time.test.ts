import { describe, expect, it } from "vitest";
import { addDaysLocal, dayKey, formatTime, utcToZonedInput, zonedTimeToUtc } from "@/lib/time";

describe("zonedTimeToUtc", () => {
  it("Lisboa no inverno é igual a UTC", () => {
    expect(zonedTimeToUtc("2026-11-23T18:00", "Europe/Lisbon").toISOString()).toBe("2026-11-23T18:00:00.000Z");
  });
  it("Lisboa no verão está uma hora à frente de UTC", () => {
    expect(zonedTimeToUtc("2026-07-15T18:00", "Europe/Lisbon").toISOString()).toBe("2026-07-15T17:00:00.000Z");
  });
  it("Zurique no inverno está uma hora à frente de UTC", () => {
    expect(zonedTimeToUtc("2026-11-23T18:00", "Europe/Zurich").toISOString()).toBe("2026-11-23T17:00:00.000Z");
  });
});

describe("utcToZonedInput", () => {
  it("volta a converter para a hora do fuso", () => {
    expect(utcToZonedInput("2026-07-15T17:00:00.000Z", "Europe/Lisbon")).toEqual({ date: "2026-07-15", time: "18:00" });
  });
});

describe("addDaysLocal", () => {
  it("soma dias mantendo a hora", () => {
    expect(addDaysLocal("2026-10-23T18:00", 7)).toBe("2026-10-30T18:00");
  });
  it("passa de mês e de ano", () => {
    expect(addDaysLocal("2026-12-28T09:30", 7)).toBe("2027-01-04T09:30");
  });
});

describe("aulas semanais e mudança de hora", () => {
  it("mantém as 18h em Lisboa depois do fim do horário de verão", () => {
    const before = zonedTimeToUtc("2026-10-23T18:00", "Europe/Lisbon");
    const after = zonedTimeToUtc(addDaysLocal("2026-10-23T18:00", 7), "Europe/Lisbon");
    expect(before.toISOString()).toBe("2026-10-23T17:00:00.000Z");
    expect(after.toISOString()).toBe("2026-10-30T18:00:00.000Z");
  });
});

describe("formatação", () => {
  it("dia e hora no fuso pedido", () => {
    expect(dayKey("2026-11-23T23:30:00.000Z", "Europe/Lisbon")).toBe("2026-11-23");
    expect(dayKey("2026-11-23T23:30:00.000Z", "Europe/Zurich")).toBe("2026-11-24");
    expect(formatTime("2026-11-23T17:00:00.000Z", "Europe/Zurich")).toBe("18:00");
  });
});
