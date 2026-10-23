"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

export type Op = {
  table: string;
  kind: "update" | "delete" | "upsert";
  patch?: Record<string, unknown>;
  match?: Record<string, string>;
  onConflict?: string;
};

type Props = {
  label: string;
  ops: Op[];
  confirm?: string;
  /** Se existir, pergunta uma nota ao administrador e guarda-a em moderator_note. */
  promptNote?: string;
  tone?: "default" | "danger" | "primary";
};

const TONES = {
  default: "border-ink/30 hover:border-ink hover:bg-ink/5",
  danger: "border-clay-dark text-clay-dark hover:bg-clay/10",
  primary: "border-moss bg-moss text-white hover:bg-ink",
};

function resolve(value: unknown, note: string | null): unknown {
  if (value === "$now+7d") return new Date(Date.now() + 7 * 86_400_000).toISOString();
  if (value === "$note") return note;
  return value;
}

export function RowAction({ label, ops, confirm, promptNote, tone = "default" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    let note: string | null = null;
    if (promptNote) {
      note = window.prompt(promptNote);
      if (note === null) return;
    }
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError("");
    for (const op of ops) {
      const patch = Object.fromEntries(Object.entries(op.patch ?? {}).map(([k, v]) => [k, resolve(v, note)]));
      let result;
      if (op.kind === "upsert") {
        result = await supabase.from(op.table).upsert(patch, { onConflict: op.onConflict });
      } else if (op.kind === "update") {
        let query = supabase.from(op.table).update(patch);
        for (const [k, v] of Object.entries(op.match ?? {})) query = query.eq(k, v);
        result = await query;
      } else {
        let query = supabase.from(op.table).delete();
        for (const [k, v] of Object.entries(op.match ?? {})) query = query.eq(k, v);
        result = await query;
      }
      if (result.error) {
        setBusy(false);
        setError(result.error.message);
        return;
      }
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-50 ${TONES[tone]}`}
      >
        {label}
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs text-clay-dark">
          {error}
        </span>
      )}
    </span>
  );
}
