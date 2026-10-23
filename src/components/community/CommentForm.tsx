"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { communityCommentSchema } from "@/lib/validation";

type Props = { postId: string; userId: string };

export function CommentForm({ postId, userId }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const parsed = communityCommentSchema.safeParse({ body: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error: dbError } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, author_id: userId, body: parsed.data.body });
    setBusy(false);
    if (dbError) {
      setError("Não foi possível comentar. Tenta novamente.");
      return;
    }
    setValue("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1" noValidate>
      <div className="flex gap-2">
        <label htmlFor={`c-${postId}`} className="sr-only">
          Comentar
        </label>
        <input
          id={`c-${postId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escreve um comentário"
          className="h-10 w-full rounded-full border border-ink/25 bg-paper px-4 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 shrink-0 items-center rounded-full border border-ink/30 px-4 text-sm font-medium hover:border-ink disabled:opacity-60"
        >
          Comentar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-clay-dark">
          {error}
        </p>
      )}
    </form>
  );
}
