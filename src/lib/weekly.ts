import { getAdminClient } from "./supabase/admin";
import { getPublicClient } from "./supabase/public";

export type ContentKind = "yoga" | "meditation" | "sound";

export type ContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  description: string | null;
  durationMin: number | null;
  mediaUrl: string | null;
  coverUrl: string | null;
};

export type WeeklyFree = {
  theme: string | null;
  reflection: string | null;
  yoga: ContentItem | null;
  meditation: ContentItem | null;
  sound: ContentItem | null;
  isDemo: boolean;
};

type Row = {
  id: string;
  kind: ContentKind;
  title: string;
  description: string | null;
  duration_min: number | null;
  media_path: string | null;
  cover_path: string | null;
};

type WeeklyRow = {
  theme: string | null;
  reflection: string | null;
  yoga: Row | null;
  meditation: Row | null;
  sound: Row | null;
};

// Os conteúdos gratuitos são públicos. As páginas ficam em cache e podem ser servidas horas depois
// de geradas, por isso o link tem de durar bastante mais do que isso.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const SELECT_ITEM = "id, kind, title, description, duration_min, media_path, cover_path";

export const DEMO_WEEKLY: WeeklyFree = {
  theme: "Criar espaço",
  reflection: null,
  isDemo: true,
  yoga: {
    id: "demo-yoga",
    kind: "yoga",
    title: "Yoga para libertar costas e ombros",
    description: null,
    durationMin: 25,
    mediaUrl: null,
    coverUrl: null,
  },
  meditation: {
    id: "demo-meditation",
    kind: "meditation",
    title: "Criar espaço",
    description: null,
    durationMin: 8,
    mediaUrl: null,
    coverUrl: null,
  },
  sound: {
    id: "demo-sound",
    kind: "sound",
    title: "Floresta depois da chuva",
    description: null,
    durationMin: 15,
    mediaUrl: null,
    coverUrl: null,
  },
};

/** Devolve os três conteúdos gratuitos do período atual. */
export async function getWeeklyFree(): Promise<WeeklyFree> {
  const supabase = getPublicClient();
  if (!supabase) return DEMO_WEEKLY;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("weekly_free")
    .select(
      `theme, reflection,
       yoga:content_items!weekly_free_yoga_id_fkey(${SELECT_ITEM}),
       meditation:content_items!weekly_free_meditation_id_fkey(${SELECT_ITEM}),
       sound:content_items!weekly_free_sound_id_fkey(${SELECT_ITEM})`,
    )
    .lte("starts_on", today)
    .gte("ends_on", today)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return DEMO_WEEKLY;

  const row = data as unknown as WeeklyRow;
  const admin = getAdminClient();

  const toItem = async (r: Row | null): Promise<ContentItem | null> => {
    if (!r) return null;
    let mediaUrl: string | null = null;
    if (r.media_path && admin) {
      const { data: signed } = await admin.storage
        .from("media")
        .createSignedUrl(r.media_path, SIGNED_URL_TTL_SECONDS);
      mediaUrl = signed?.signedUrl ?? null;
    }
    const coverUrl = r.cover_path
      ? supabase.storage.from("covers").getPublicUrl(r.cover_path).data.publicUrl
      : null;
    return {
      id: r.id,
      kind: r.kind,
      title: r.title,
      description: r.description,
      durationMin: r.duration_min,
      mediaUrl,
      coverUrl,
    };
  };

  const [yoga, meditation, sound] = await Promise.all([
    toItem(row.yoga),
    toItem(row.meditation),
    toItem(row.sound),
  ]);

  return {
    theme: row.theme,
    reflection: row.reflection,
    yoga,
    meditation,
    sound,
    isDemo: false,
  };
}
