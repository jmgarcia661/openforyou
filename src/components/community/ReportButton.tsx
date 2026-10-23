"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { reportSchema } from "@/lib/validation";

type Props = { userId: string; postId?: string; commentId?: string };

export function ReportButton({ userId, postId, commentId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function send() {
    const parsed = reportSchema.safeParse({ reason });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from("community_reports").insert({
      reporter_id: userId,
      post_id: postId ?? null,
      comment_id: commentId ?? null,
      reason: parsed.data.reason,
    });
    setBusy(false);
    if (error) {
      setMessage("Não foi possível enviar a denúncia. Tenta novamente.");
      return;
    }
    setOpen(false);
    setReason("");
    setMessage("Obrigado. Vamos analisar.");
  }

  if (message && !open) {
    return <span className="text-xs text-ink-soft">{message}</span>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink-soft underline underline-offset-4">
        Denunciar
      </button>
    );
  }

  return (
    <span className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor={`r-${postId ?? commentId}`} className="sr-only">
        Motivo da denúncia
      </label>
      <input
        id={`r-${postId ?? commentId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Porque estás a denunciar?"
        className="h-9 w-full rounded-full border border-ink/25 bg-paper px-4 text-sm"
      />
      <span className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-full border border-ink/30 px-4 text-sm hover:border-ink disabled:opacity-60"
        >
          Enviar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm underline underline-offset-4">
          Cancelar
        </button>
      </span>
      {message && (
        <span role="alert" className="text-xs text-clay-dark">
          {message}
        </span>
      )}
    </span>
  );
}
