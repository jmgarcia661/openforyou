"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice } from "@/components/auth/Notice";
import type { ModerationMode as Mode } from "@/lib/community";
import { getBrowserClient } from "@/lib/supabase/browser";

export function ModerationMode({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [value, setValue] = useState<Mode>(mode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function save() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "community", value: { moderation: value } }, { onConflict: "key" });
    setBusy(false);
    if (error) {
      setMessage({ kind: "error", text: `Não foi possível guardar: ${error.message}` });
      return;
    }
    setMessage({ kind: "success", text: "Modo de moderação guardado." });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="mode" className="sr-only">
          Modo de moderação
        </label>
        <select
          id="mode"
          value={value}
          onChange={(e) => setValue(e.target.value as Mode)}
          className="h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base sm:max-w-md"
        >
          <option value="after">Publicar logo e moderar depois</option>
          <option value="before">Aprovar cada publicação antes de aparecer</option>
        </select>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-full border border-ink/30 px-6 text-sm font-medium hover:border-ink disabled:opacity-60"
        >
          Guardar
        </button>
      </div>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
    </div>
  );
}
