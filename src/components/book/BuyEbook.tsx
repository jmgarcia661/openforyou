"use client";

import Link from "next/link";
import { useState } from "react";
import { Notice } from "@/components/auth/Notice";

export function BuyEbook({ priceLabel }: { priceLabel: string }) {
  const [terms, setTerms] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setError("");
    if (!terms || !immediate) {
      setError("Aceita as duas condições para continuar.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/livro/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms, immediate }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setPending(false);
        setError(data.error ?? "Não foi possível iniciar o pagamento. Tenta novamente.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setPending(false);
      setError("Sem ligação. Verifica a internet e tenta novamente.");
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 size-4 accent-clay" />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="underline underline-offset-4">
            termos
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={immediate}
          onChange={(e) => setImmediate(e.target.checked)}
          className="mt-1 size-4 accent-clay"
        />
        <span>
          Quero receber o eBook de imediato. Sei que, depois de começar o download, deixo de ter direito à livre resolução
          de 14 dias (ver política de cancelamento).
        </span>
      </label>
      {error && <Notice kind="error">{error}</Notice>}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-12 items-center rounded-full bg-clay px-6 font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
      >
        {pending ? "A abrir o pagamento" : `Comprar o eBook, ${priceLabel}`}
      </button>
    </div>
  );
}
