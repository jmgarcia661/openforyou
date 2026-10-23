import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentKind } from "./weekly";

export type { ContentKind };

export const KINDS: ContentKind[] = ["yoga", "meditation", "sound"];

export const KIND_LABEL: Record<ContentKind, string> = {
  yoga: "Yoga",
  meditation: "Meditações",
  sound: "Sons",
};

export const KIND_SINGULAR: Record<ContentKind, string> = {
  yoga: "Aula de Yoga",
  meditation: "Meditação",
  sound: "Som",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  scheduled: "Agendado",
  published: "Publicado",
  archived: "Arquivado",
};

export const ACCESS_LABEL: Record<string, string> = {
  free: "Gratuito",
  premium: "Membros",
};

export const LIST_COLUMNS =
  "id, kind, title, description, duration_min, teacher, level, intensity, goal, cover_path, access, status, publish_at";
export const FULL_COLUMNS = `${LIST_COLUMNS}, materials, transcript, media_path`;

export type ContentRow = {
  id: string;
  kind: ContentKind;
  title: string;
  description: string | null;
  duration_min: number | null;
  teacher: string | null;
  level: string | null;
  intensity: string | null;
  goal: string | null;
  materials?: string | null;
  transcript?: string | null;
  media_path?: string | null;
  cover_path: string | null;
  access: "free" | "premium";
  status: string;
  publish_at: string | null;
};

export function isKind(value: unknown): value is ContentKind {
  return value === "yoga" || value === "meditation" || value === "sound";
}

/** Linha curta para os cartões: "25 min · Todos os níveis · José Maria Garcia". */
export function metaLine(item: Pick<ContentRow, "duration_min" | "level" | "teacher">): string {
  return [item.duration_min ? `${item.duration_min} min` : null, item.level, item.teacher]
    .filter(Boolean)
    .join(" · ");
}

export function coverUrl(supabase: SupabaseClient, path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}
