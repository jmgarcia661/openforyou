"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  contentId: string;
  initialFavorite: boolean;
  initialCompleted: boolean;
};

const BTN =
  "inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors disabled:opacity-60";

export function ItemActions({ userId, contentId, initialFavorite, initialCompleted }: Props) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);

  async function toggle(table: "favorites" | "completions", current: boolean, set: (v: boolean) => void) {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = current
      ? await supabase.from(table).delete().eq("user_id", userId).eq("content_id", contentId)
      : await supabase.from(table).insert({ user_id: userId, content_id: contentId });
    if (!error) set(!current);
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => toggle("favorites", favorite, setFavorite)}
        aria-pressed={favorite}
        className={`${BTN} ${favorite ? "border-clay bg-clay text-white" : "border-ink/30 hover:border-ink"}`}
      >
        {favorite ? "Nos favoritos" : "Guardar nos favoritos"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toggle("completions", completed, setCompleted)}
        aria-pressed={completed}
        className={`${BTN} ${completed ? "border-moss bg-moss text-white" : "border-ink/30 hover:border-ink"}`}
      >
        {completed ? "Concluída" : "Marcar como concluída"}
      </button>
    </div>
  );
}
