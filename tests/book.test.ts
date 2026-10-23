import { describe, expect, it } from "vitest";
import { centsToInput, isOrderActive, parseBookSettings, parsePriceToCents, remainingDownloads } from "@/lib/book";

describe("parsePriceToCents", () => {
  it("aceita euros inteiros, com vírgula e com ponto", () => {
    expect(parsePriceToCents("14")).toBe(1400);
    expect(parsePriceToCents("14,5")).toBe(1450);
    expect(parsePriceToCents("14.99")).toBe(1499);
    expect(parsePriceToCents(" 12,00 ")).toBe(1200);
  });
  it("recusa valores inválidos ou fora do intervalo", () => {
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("0")).toBeNull();
    expect(parsePriceToCents("0,50")).toBeNull();
    expect(parsePriceToCents("501")).toBeNull();
    expect(parsePriceToCents("14,999")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
  });
});

describe("centsToInput", () => {
  it("escreve o preço como se escreve em português", () => {
    expect(centsToInput(1400)).toBe("14");
    expect(centsToInput(1450)).toBe("14,50");
    expect(centsToInput(1499)).toBe("14,99");
  });
});

describe("compras do eBook", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  it("uma compra paga e dentro do prazo está ativa", () => {
    expect(isOrderActive({ status: "paid", expires_at: "2026-11-01T00:00:00Z" }, now)).toBe(true);
  });
  it("expira depois do prazo", () => {
    expect(isOrderActive({ status: "paid", expires_at: "2026-10-01T00:00:00Z" }, now)).toBe(false);
  });
  it("uma compra reembolsada não está ativa", () => {
    expect(isOrderActive({ status: "refunded", expires_at: "2026-11-01T00:00:00Z" }, now)).toBe(false);
  });
  it("conta os downloads que restam", () => {
    expect(remainingDownloads({ downloads: 2, download_limit: 5 })).toBe(3);
    expect(remainingDownloads({ downloads: 5, download_limit: 5 })).toBe(0);
    expect(remainingDownloads({ downloads: 9, download_limit: 5 })).toBe(0);
  });
});

describe("parseBookSettings", () => {
  it("aceita definições vazias ou inválidas", () => {
    expect(parseBookSettings(null)).toEqual({ cover_path: null, excerpt_path: null, kindle_url: null, bonus_content_id: null });
    expect(parseBookSettings({ kindle_url: "" }).kindle_url).toBeNull();
    expect(parseBookSettings({ kindle_url: 5 }).kindle_url).toBeNull();
  });
  it("lê os valores guardados", () => {
    const s = parseBookSettings({ cover_path: "book/c.jpg", kindle_url: "https://amazon.com/x", bonus_content_id: "abc" });
    expect(s.cover_path).toBe("book/c.jpg");
    expect(s.kindle_url).toBe("https://amazon.com/x");
    expect(s.bonus_content_id).toBe("abc");
  });
});
