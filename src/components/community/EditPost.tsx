"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { communityPostSchema } from "@/lib/validation";

type Props = { postId: string; body: string };

export function EditPost({ postId, body }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const parsed = communityPostSchema.safeParse({ body: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error: dbError } = await supabase.from("community_posts").update({ body: parsed.data.body }).eq("id", postId);
    setBusy(false);
    if (dbError) {
      setError("Não foi possível guardar.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-full border border-ink/30 px-4 text-sm font-medium hover:border-ink"
      >
        Editar
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <label htmlFor={`e-${postId}`} className="sr-only">
        Editar publicação
      </label>
      <textarea
        id={`e-${postId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-ink/25 bg-paper px-4 py-3 text-base"
      />
      {error && (
        <p role="alert" className="text-xs text-clay-dark">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-full bg-moss px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          Guardar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm underline underline-offset-4">
          Cancelar
        </button>
      </div>
    </div>
  );
}
