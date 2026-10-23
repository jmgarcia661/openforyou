import { describe, expect, it } from "vitest";
import { checkImage, MAX_IMAGE_BYTES, parseMode, timeAgo } from "@/lib/community";
import { communityCommentSchema, communityPostSchema, reportSchema } from "@/lib/validation";

describe("checkImage", () => {
  it("aceita JPG, PNG e WebP pequenos", () => {
    expect(checkImage({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(checkImage({ type: "image/png", size: 1000 })).toBeNull();
    expect(checkImage({ type: "image/webp", size: 1000 })).toBeNull();
  });
  it("recusa outros tipos", () => {
    expect(checkImage({ type: "image/gif", size: 1000 })).not.toBeNull();
    expect(checkImage({ type: "application/pdf", size: 1000 })).not.toBeNull();
  });
  it("recusa imagens acima de 5 MB", () => {
    expect(checkImage({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).not.toBeNull();
    expect(checkImage({ type: "image/jpeg", size: MAX_IMAGE_BYTES })).toBeNull();
  });
});

describe("parseMode", () => {
  it("por omissão modera depois de publicar", () => {
    expect(parseMode(undefined)).toBe("after");
    expect(parseMode(null)).toBe("after");
    expect(parseMode({})).toBe("after");
    expect(parseMode({ moderation: "after" })).toBe("after");
  });
  it("só passa a aprovar antes se estiver definido", () => {
    expect(parseMode({ moderation: "before" })).toBe("before");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  it("diz agora mesmo, minutos, horas e dias", () => {
    expect(timeAgo("2026-10-23T11:59:30Z", now)).toBe("agora mesmo");
    expect(timeAgo("2026-10-23T11:55:00Z", now)).toBe("há 5 min");
    expect(timeAgo("2026-10-23T09:00:00Z", now)).toBe("há 3 h");
    expect(timeAgo("2026-10-22T11:00:00Z", now)).toBe("há 1 dia");
    expect(timeAgo("2026-10-20T11:00:00Z", now)).toBe("há 3 dias");
  });
  it("usa a data para o que é mais antigo", () => {
    expect(timeAgo("2026-09-01T12:00:00Z", now)).toContain("setembro");
  });
});

describe("validação da comunidade", () => {
  it("a publicação não pode ser vazia nem enorme", () => {
    expect(communityPostSchema.safeParse({ body: "Olá" }).success).toBe(true);
    expect(communityPostSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(communityPostSchema.safeParse({ body: "a".repeat(2001) }).success).toBe(false);
  });
  it("o comentário tem limite de 1000 caracteres", () => {
    expect(communityCommentSchema.safeParse({ body: "Bonito" }).success).toBe(true);
    expect(communityCommentSchema.safeParse({ body: "a".repeat(1001) }).success).toBe(false);
  });
  it("a denúncia exige um motivo", () => {
    expect(reportSchema.safeParse({ reason: "Conteúdo ofensivo" }).success).toBe(true);
    expect(reportSchema.safeParse({ reason: "" }).success).toBe(false);
  });
});
