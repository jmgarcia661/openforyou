"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = { postId: string; imagePath: string | null };

export function DeletePost({ postId, imagePath }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!window.confirm("Eliminar esta publicação?")) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: dbError } = await supabase.from("community_posts").delete().eq("id", postId);
    if (dbError) {
      setBusy(false);
      setError("Não foi possível eliminar.");
      return;
    }
    // A fotografia também sai do armazenamento: eliminar quer dizer eliminar.
    if (imagePath) await supabase.storage.from("community").remove([imagePath]);
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-9 items-center rounded-full border border-clay-dark px-4 text-sm font-medium text-clay-dark transition-colors hover:bg-clay/10 disabled:opacity-50"
      >
        Eliminar
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs text-clay-dark">
          {error}
        </span>
      )}
    </span>
  );
}
