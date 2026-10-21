import { describe, expect, it } from "vitest";
import { safeNext, translateAuthError } from "@/lib/auth";
import { loginSchema, newPasswordSchema, profileSchema, registerSchema } from "@/lib/validation";

describe("safeNext", () => {
  it("aceita caminhos internos", () => {
    expect(safeNext("/conta/nova-password")).toBe("/conta/nova-password");
  });
  it("rejeita sites externos e caminhos suspeitos", () => {
    expect(safeNext("https://mau.com")).toBe("/conta");
    expect(safeNext("//mau.com")).toBe("/conta");
    expect(safeNext("/\\mau.com")).toBe("/conta");
    expect(safeNext(null)).toBe("/conta");
  });
});

describe("translateAuthError", () => {
  it("traduz credenciais inválidas", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("Email ou palavra-passe incorretos.");
  });
  it("usa mensagem genérica para erros desconhecidos", () => {
    expect(translateAuthError("boom")).toContain("Não foi possível");
  });
});

describe("registerSchema", () => {
  const valid = { name: "Ana", email: "ana@example.com", password: "uma-password-longa", terms: true };
  it("aceita dados válidos", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });
  it("exige 10 caracteres na palavra-passe", () => {
    expect(registerSchema.safeParse({ ...valid, password: "curta" }).success).toBe(false);
  });
  it("exige aceitar os termos", () => {
    expect(registerSchema.safeParse({ ...valid, terms: false }).success).toBe(false);
  });
});

describe("loginSchema e profileSchema", () => {
  it("rejeita email inválido no login", () => {
    expect(loginSchema.safeParse({ email: "x", password: "abc" }).success).toBe(false);
  });
  it("valida o perfil", () => {
    expect(profileSchema.safeParse({ name: "Ana", timezone: "Europe/Lisbon" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: " ", timezone: "Europe/Lisbon" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("exige que as palavras-passe coincidam", () => {
    expect(newPasswordSchema.safeParse({ password: "uma-password-longa", confirm: "outra" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "uma-password-longa", confirm: "uma-password-longa" }).success).toBe(true);
  });
});
