"use client";

import { useState } from "react";
import { Notice } from "./auth/Notice";

export function ManageSubscription({ label = "Gerir subscrição" }: { label?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) {
        setPending(false);
        setError("Não foi possível abrir a gestão da subscrição. Tenta novamente.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setPending(false);
      setError("Sem ligação. Tenta novamente.");
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-12 items-center rounded-full border border-ink/30 px-6 font-medium transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-60"
      >
        {pending ? "A abrir" : label}
      </button>
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  );
}
