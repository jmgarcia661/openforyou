"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Notice } from "./Notice";

const WORD = "ELIMINAR";

export function DeleteAccount() {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    setError("");
    setPending(true);
    const res = await fetch("/api/conta/eliminar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: value }),
    });
    if (!res.ok) {
      setPending(false);
      setError("Não foi possível eliminar a conta. Tenta novamente ou contacta-nos.");
      return;
    }
    await getBrowserClient()?.auth.signOut();
    window.location.assign("/?conta=eliminada");
  }

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">
        Elimina a tua conta e os dados associados. Esta ação não pode ser desfeita. Para confirmar, escreve{" "}
        <strong>{WORD}</strong>.
      </p>
      <label htmlFor="confirm-delete" className="sr-only">
        Escreve {WORD} para confirmar
      </label>
      <input
        id="confirm-delete"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base"
      />
      {error && <Notice kind="error">{error}</Notice>}
      <button
        type="button"
        onClick={onDelete}
        disabled={value !== WORD || pending}
        className="inline-flex h-12 items-center rounded-full bg-clay-dark px-6 font-medium text-white disabled:opacity-40"
      >
        {pending ? "A eliminar" : "Eliminar a minha conta"}
      </button>
    </div>
  );
}
