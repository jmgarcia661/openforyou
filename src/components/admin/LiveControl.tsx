"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/auth/Notice";
import { effectiveStatus, LIVE_STATUS_LABEL, type LiveEvent } from "@/lib/live";
import { getBrowserClient } from "@/lib/supabase/browser";

const INPUT = "h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base";
const BTN =
  "inline-flex h-11 items-center justify-center rounded-full border border-ink/30 px-5 text-sm font-medium transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-50";
const BTN_MAIN =
  "inline-flex h-12 items-center justify-center rounded-full bg-clay px-6 font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-50";

export type Secrets = { join_url: string; host_url: string; meeting_id: string; passcode: string };
export type RecordingOption = { id: string; title: string };

type Props = {
  event: LiveEvent;
  secrets: Secrets;
  recordings: RecordingOption[];
  joinCount: number;
};

type Feedback = { kind: "error" | "success"; text: string } | null;

export function LiveControl({ event: initial, secrets: initialSecrets, recordings, joinCount }: Props) {
  const [event, setEvent] = useState(initial);
  const [secrets, setSecrets] = useState(initialSecrets);
  const [present, setPresent] = useState(0);
  const [joins, setJoins] = useState(joinCount);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState(initial.waiting_message ?? "");
  const [delayMessage, setDelayMessage] = useState(initial.delay_message ?? "");
  const [lateMessage, setLateMessage] = useState(initial.late_message ?? "");

  // Quantas pessoas estão na sala de espera neste momento.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`live-${initial.id}`)
      .on("presence", { event: "sync" }, () => setPresent(Object.keys(channel.presenceState()).length))
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initial.id]);

  async function update(patch: Partial<LiveEvent>, success: string) {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setFeedback(null);
    const { error } = await supabase.from("live_events").update(patch).eq("id", event.id);
    setBusy(false);
    if (error) {
      setFeedback({ kind: "error", text: `Não foi possível guardar: ${error.message}` });
      return;
    }
    setEvent((current) => ({ ...current, ...patch }));
    setFeedback({ kind: "success", text: success });
  }

  async function activate() {
    if (!secrets.join_url.trim()) {
      setFeedback({ kind: "error", text: "Guarda primeiro o link dos participantes do Zoom." });
      return;
    }
    await update({ status: "live" }, "A aula está em direto. Quem está na sala de espera já recebeu a atualização.");
  }

  async function saveSecrets() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setFeedback(null);
    const { error } = await supabase.from("live_secrets").upsert(
      {
        event_id: event.id,
        join_url: secrets.join_url.trim() || null,
        host_url: secrets.host_url.trim() || null,
        meeting_id: secrets.meeting_id.trim() || null,
        passcode: secrets.passcode.trim() || null,
      },
      { onConflict: "event_id" },
    );
    setBusy(false);
    setFeedback(
      error
        ? { kind: "error", text: `Não foi possível guardar as ligações: ${error.message}` }
        : { kind: "success", text: "Ligações guardadas." },
    );
  }

  async function refreshJoins() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { count } = await supabase
      .from("live_access_log")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("action", "join");
    setJoins(count ?? 0);
  }

  function cancelEvent() {
    if (!window.confirm("Cancelar esta aula? Os membros vão ver que foi cancelada.")) return;
    void update({ status: "cancelled" }, "Aula cancelada.");
  }

  const status = effectiveStatus(event);

  return (
    <section aria-labelledby="live-h" className="space-y-8 rounded-3xl bg-sand p-6 md:p-8">
      <div>
        <h2 id="live-h" className="text-3xl">
          Controlo da aula
        </h2>
        <p className="mt-2 text-lg">
          Estado: <strong>{LIVE_STATUS_LABEL[status]}</strong>
          {!event.entries_open && " · entradas fechadas"}
        </p>
        <p className="mt-1 text-ink-soft">
          Na sala de espera agora: {present} · Entradas no Zoom: {joins}{" "}
          <button type="button" onClick={refreshJoins} className="underline underline-offset-4">
            atualizar
          </button>
        </p>
      </div>

      {feedback && <Notice kind={feedback.kind}>{feedback.text}</Notice>}

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} className={BTN} onClick={() => update({ status: "waiting" }, "Sala de espera aberta.")}>
          Abrir sala de espera
        </button>
        <button type="button" disabled={busy} className={BTN_MAIN} onClick={activate}>
          Abrir aula no Zoom
        </button>
        <button
          type="button"
          disabled={busy}
          className={BTN}
          onClick={() =>
            update(
              { entries_open: !event.entries_open },
              event.entries_open ? "Novas entradas pausadas." : "Entradas reabertas.",
            )
          }
        >
          {event.entries_open ? "Pausar novas entradas" : "Reabrir entradas"}
        </button>
        <button type="button" disabled={busy} className={BTN} onClick={() => update({ status: "ended" }, "Aula terminada.")}>
          Terminar aula
        </button>
        <button type="button" disabled={busy} className={BTN} onClick={cancelEvent}>
          Cancelar aula
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="waiting-message" className="mb-1 block text-sm font-medium">
            Mensagem na sala de espera
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="waiting-message" value={waitingMessage} onChange={(e) => setWaitingMessage(e.target.value)} className={INPUT} />
            <button
              type="button"
              disabled={busy}
              className={BTN}
              onClick={() => update({ waiting_message: waitingMessage.trim() || null }, "Mensagem guardada.")}
            >
              Guardar
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="delay-message" className="mb-1 block text-sm font-medium">
            Aviso de atraso
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="delay-message"
              value={delayMessage}
              onChange={(e) => setDelayMessage(e.target.value)}
              placeholder="A aula começará dentro de aproximadamente cinco minutos. Obrigado por aguardares."
              className={INPUT}
            />
            <button
              type="button"
              disabled={busy}
              className={BTN}
              onClick={() => update({ delay_message: delayMessage.trim() || null }, "Aviso enviado aos membros.")}
            >
              Avisar
            </button>
            <button
              type="button"
              disabled={busy}
              className={BTN}
              onClick={() => {
                setDelayMessage("");
                void update({ delay_message: null }, "Aviso retirado.");
              }}
            >
              Retirar
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="late-message" className="mb-1 block text-sm font-medium">
            Mensagem para quem chega com as entradas fechadas
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="late-message" value={lateMessage} onChange={(e) => setLateMessage(e.target.value)} className={INPUT} />
            <button
              type="button"
              disabled={busy}
              className={BTN}
              onClick={() => update({ late_message: lateMessage.trim() || null }, "Mensagem guardada.")}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <fieldset className="space-y-4 border-t border-ink/15 pt-6">
        <legend className="text-xl">Ligações do Zoom</legend>
        <p className="text-sm text-ink-soft">
          O link do participante só é entregue a membros, depois de abrires a aula. O link do anfitrião é só teu e nunca é
          enviado a ninguém.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="join-url" className="mb-1 block text-sm font-medium">
              Link dos participantes
            </label>
            <input id="join-url" value={secrets.join_url} onChange={(e) => setSecrets({ ...secrets, join_url: e.target.value })} className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="host-url" className="mb-1 block text-sm font-medium">
              Link do anfitrião (privado)
            </label>
            <input id="host-url" value={secrets.host_url} onChange={(e) => setSecrets({ ...secrets, host_url: e.target.value })} className={INPUT} />
          </div>
          <div>
            <label htmlFor="meeting-id" className="mb-1 block text-sm font-medium">
              ID da reunião
            </label>
            <input id="meeting-id" value={secrets.meeting_id} onChange={(e) => setSecrets({ ...secrets, meeting_id: e.target.value })} className={INPUT} />
          </div>
          <div>
            <label htmlFor="passcode" className="mb-1 block text-sm font-medium">
              Código de acesso
            </label>
            <input id="passcode" value={secrets.passcode} onChange={(e) => setSecrets({ ...secrets, passcode: e.target.value })} className={INPUT} />
          </div>
        </div>
        <button type="button" disabled={busy} className={BTN} onClick={saveSecrets}>
          Guardar ligações
        </button>
      </fieldset>

      <div className="border-t border-ink/15 pt-6">
        <label htmlFor="recording" className="mb-1 block text-sm font-medium">
          Gravação (depois da aula)
        </label>
        <select
          id="recording"
          value={event.recording_content_id ?? ""}
          onChange={(e) => update({ recording_content_id: e.target.value || null }, "Gravação associada.")}
          className={INPUT}
        >
          <option value="">Sem gravação associada</option>
          {recordings.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-ink-soft">
          Primeiro adiciona a gravação em Conteúdos (como aula de Yoga publicada) e depois escolhe-a aqui.
        </p>
      </div>
    </section>
  );
}
