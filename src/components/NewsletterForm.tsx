"use client";

import Link from "next/link";
import { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Não foi possível guardar o teu pedido. Tenta novamente.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Sem ligação. Verifica a internet e tenta novamente.");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="rounded-2xl bg-paper p-6 text-lg">
        Obrigado. Recebes as práticas da semana assim que o teu pedido for confirmado.
      </p>
    );
  }

  const field =
    "h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base placeholder:text-ink-soft/70";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nl-name" className="mb-1 block text-sm font-medium">
            Nome
          </label>
          <input id="nl-name" name="name" type="text" autoComplete="given-name" required className={field} />
        </div>
        <div>
          <label htmlFor="nl-email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input id="nl-email" name="email" type="email" autoComplete="email" required className={field} />
        </div>
      </div>

      {/* Campo isco anti-spam */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="nl-website">Website</label>
        <input id="nl-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input name="consent" type="checkbox" required className="mt-1 size-4 accent-clay" />
        <span>
          Aceito receber as práticas gratuitas da semana e a reflexão mensal, e li a{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            política de privacidade
          </Link>
          .
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="text-sm font-medium text-clay-dark">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-12 items-center rounded-full bg-clay px-6 font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
      >
        {status === "sending" ? "A enviar" : "Quero receber"}
      </button>
    </form>
  );
}
