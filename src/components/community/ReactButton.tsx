"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = { postId: string; userId: string; count: number; reacted: boolean };

export function ReactButton({ postId, userId, count, reacted }: Props) {
  const [on, setOn] = useState(reacted);
  const [total, setTotal] = useState(count);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = on
      ? await supabase.from("community_reactions").delete().eq("post_id", postId).eq("user_id", userId)
      : await supabase.from("community_reactions").insert({ post_id: postId, user_id: userId });
    if (!error) {
      setOn(!on);
      setTotal((n) => n + (on ? -1 : 1));
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? "Retirar o coração" : "Dar um coração"}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors disabled:opacity-60 ${
        on ? "border-clay bg-clay text-white" : "border-ink/30 hover:border-ink"
      }`}
    >
      <span aria-hidden="true">{on ? "♥" : "♡"}</span>
      {total}
    </button>
  );
}
