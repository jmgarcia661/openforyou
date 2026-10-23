"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = { eventId: string; userId: string; initial: boolean };

export function RsvpButton({ eventId, userId, initial }: Props) {
  const [going, setGoing] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = going
      ? await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", userId)
      : await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: userId });
    if (!error) setGoing(!going);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={going}
      className={`inline-flex h-12 items-center rounded-full border px-6 font-medium transition-colors disabled:opacity-60 ${
        going ? "border-moss bg-moss text-white" : "border-ink/30 hover:border-ink"
      }`}
    >
      {going ? "Vou estar presente" : "Confirmar presença"}
    </button>
  );
}
