export type PostStatus = "pending" | "published" | "rejected" | "removed";
export type ModerationMode = "before" | "after";

export type CommunityPost = {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  image_path: string | null;
  theme: string | null;
  status: PostStatus;
  pinned: boolean;
  comments_closed: boolean;
  moderator_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export const POST_COLUMNS =
  "id, author_id, author_name, body, image_path, theme, status, pinned, comments_closed, moderator_note, created_at, updated_at";
export const COMMENT_COLUMNS = "id, post_id, author_id, author_name, body, created_at";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Devolve a mensagem de erro, ou null se a imagem for aceitável. */
export function checkImage(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Usa uma imagem JPG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "A imagem é demasiado grande (máximo 5 MB).";
  return null;
}

export function parseMode(value: unknown): ModerationMode {
  const mode = typeof value === "object" && value !== null ? (value as { moderation?: unknown }).moderation : null;
  return mode === "before" ? "before" : "after";
}

/** "há 5 min", "há 3 h", ou a data para o que é mais antigo. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "há 1 dia" : `há ${days} dias`;
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long" }).format(new Date(iso));
}

export const STATUS_NOTE: Record<string, string> = {
  pending: "A aguardar aprovação. Só tu vês esta publicação por enquanto.",
  rejected: "Esta publicação não foi aprovada. Se a editares, volta a ser analisada.",
};
