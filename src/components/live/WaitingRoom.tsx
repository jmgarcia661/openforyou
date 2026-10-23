"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { effectiveStatus, type LiveEvent } from "@/lib/live";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Countdown } from "./Countdown";

type Props = { initial: LiveEvent; userId: string };

const AUTO_KEY = "ofy:auto-open";

export function WaitingRoom({ initial, userId }: Props) {
  const [event, setEvent] = useState<LiveEvent>(initial);
  const [now, setNow] = useState(() => new Date());
  const [autoOpen, setAutoOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const previous = useRef(effectiveStatus(initial));

  useEffect(() => {
    setAutoOpen(window.localStorage.getItem(AUTO_KEY) === "1");
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Atualizações em tempo real e presença na sala de espera.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`live-${initial.id}`, { config: { presence: { key: userId } } })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_events", filter: `id=eq.${initial.id}` },
        (payload) => setEvent((current) => ({ ...current, ...(payload.new as Partial<LiveEvent>) })),
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: userId, at: Date.now() });
      });

    void supabase.from("live_access_log").insert({ event_id: initial.id, user_id: userId, action: "waiting" });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initial.id, userId]);

  const join = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/live/${initial.id}/join`, { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setMessage(data.error ?? "Não foi possível entrar na aula.");
        return;
      }
      setFallbackUrl(data.url);
      const opened = window.open(data.url, "_blank", "noopener");
      if (!opened) setMessage("O navegador bloqueou a abertura automática. Usa o botão abaixo.");
    } catch {
      setMessage("Sem ligação. Tenta novamente.");
    } finally {
      setBusy(false);
    }
  }, [initial.id]);

  const status = effectiveStatus(event, now);

  // Abertura automática, só se a pessoa o escolheu antes.
  useEffect(() => {
    if (previous.current !== "live" && status === "live" && autoOpen) void join();
    previous.current = status;
  }, [status, autoOpen, join]);

  function onToggleAuto(checked: boolean) {
    setAutoOpen(checked);
    window.localStorage.setItem(AUTO_KEY, checked ? "1" : "0");
  }

  if (status === "cancelled") {
    return <p className="rounded-2xl bg-sand p-6 text-lg">Esta aula foi cancelada.</p>;
  }
  if (status === "ended") {
    return <p className="rounded-2xl bg-sand p-6 text-lg">Esta aula já terminou.</p>;
  }

  return (
    <div className="space-y-8">
      {event.delay_message && (
        <p role="status" className="rounded-2xl bg-clay/10 p-5 text-lg text-clay-dark">
          {event.delay_message}
        </p>
      )}

      {status === "live" ? (
        <div className="rounded-3xl bg-moss p-8 text-paper md:p-10">
          <p className="text-lg">A aula está em direto.</p>
          {event.entries_open ? (
            <>
              <button
                type="button"
                onClick={join}
                disabled={busy}
                className="mt-5 inline-flex h-14 items-center rounded-full bg-paper px-8 text-lg font-medium text-ink transition-colors hover:bg-sand disabled:opacity-60"
              >
                {busy ? "A abrir" : "Entrar agora na aula"}
              </button>
              {fallbackUrl && (
                <p className="mt-4 text-sm">
                  Se a aula não abriu,{" "}
                  <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    clica aqui
                  </a>
                  .
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-lg">
              {event.late_message || "As entradas para esta aula já estão fechadas."}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-sand p-8 md:p-10">
          <p className="text-ink-soft">{status === "waiting" ? "A aula começa em" : "A sala abre em breve. A aula começa em"}</p>
          <p className="mt-2 font-display text-5xl md:text-6xl">
            <Countdown target={event.starts_at} />
          </p>
          <p className="mt-6 max-w-xl text-lg">
            {event.waiting_message ||
              "A prática começa em breve. Prepara o teu espaço, coloca o telemóvel em silêncio e dá a ti próprio estes minutos para chegar."}
          </p>
        </div>
      )}

      {message && (
        <p role="alert" className="rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay-dark">
          {message}
        </p>
      )}

      {event.materials && (
        <p className="text-ink-soft">
          <span className="font-medium text-ink">Vais precisar de:</span> {event.materials}
        </p>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={autoOpen}
          onChange={(e) => onToggleAuto(e.target.checked)}
          className="mt-1 size-4 accent-clay"
        />
        <span>
          Abrir a aula automaticamente quando começar. Se o navegador bloquear, o botão fica sempre disponível.
        </span>
      </label>
    </div>
  );
}
