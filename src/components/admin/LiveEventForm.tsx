"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { EVENT_TYPES, type LiveEvent } from "@/lib/live";
import { addDaysLocal, TIMEZONES, utcToZonedInput, zonedTimeToUtc } from "@/lib/time";
import { getBrowserClient } from "@/lib/supabase/browser";
import { liveEventSchema } from "@/lib/validation";

const INPUT = "h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base";
const AREA = "w-full rounded-xl border border-ink/25 bg-paper px-4 py-3 text-base";

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

export function LiveEventForm({ initial }: { initial?: LiveEvent }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const start = initial ? utcToZonedInput(initial.starts_at, initial.timezone) : { date: "", time: "18:00" };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const parsed = liveEventSchema.safeParse({
      title: text(form, "title"),
      eventType: text(form, "eventType"),
      description: text(form, "description"),
      teacher: text(form, "teacher"),
      level: text(form, "level"),
      materials: text(form, "materials"),
      date: text(form, "date"),
      time: text(form, "time"),
      timezone: text(form, "timezone"),
      duration: text(form, "duration"),
      waitingOpens: text(form, "waitingOpens"),
      repeat: initial ? "0" : text(form, "repeat") || "0",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setError("O Supabase não está configurado.");
      return;
    }

    const d = parsed.data;
    const base = {
      title: d.title,
      event_type: d.eventType,
      description: d.description || null,
      teacher: d.teacher || null,
      level: d.level || null,
      materials: d.materials || null,
      timezone: d.timezone,
      duration_min: Number(d.duration),
      waiting_opens_min: Number(d.waitingOpens),
      has_recording: form.get("hasRecording") === "on",
    };
    const local = `${d.date}T${d.time}`;

    setPending(true);
    let dbError;
    if (initial) {
      ({ error: dbError } = await supabase
        .from("live_events")
        .update({ ...base, starts_at: zonedTimeToUtc(local, d.timezone).toISOString() })
        .eq("id", initial.id));
    } else {
      const weeks = Number(d.repeat);
      const seriesId = weeks > 0 ? crypto.randomUUID() : null;
      const rows = Array.from({ length: weeks + 1 }, (_, i) => ({
        ...base,
        series_id: seriesId,
        starts_at: zonedTimeToUtc(addDaysLocal(local, 7 * i), d.timezone).toISOString(),
      }));
      ({ error: dbError } = await supabase.from("live_events").insert(rows));
    }

    if (dbError) {
      setPending(false);
      setError(`Não foi possível guardar: ${dbError.message}`);
      return;
    }
    router.push("/admin/aulas");
    router.refresh();
  }

  async function onDelete() {
    if (!initial) return;
    if (!window.confirm("Eliminar esta aula? Esta ação não pode ser desfeita.")) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { error: dbError } = await supabase.from("live_events").delete().eq("id", initial.id);
    if (dbError) {
      setError(`Não foi possível eliminar: ${dbError.message}`);
      return;
    }
    router.push("/admin/aulas");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Título
        </label>
        <input id="title" name="title" defaultValue={initial?.title ?? ""} className={INPUT} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eventType" className="mb-1 block text-sm font-medium">
            Tipo
          </label>
          <select id="eventType" name="eventType" defaultValue={initial?.event_type ?? "yoga_active"} className={INPUT}>
            {Object.entries(EVENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="teacher" className="mb-1 block text-sm font-medium">
            Professor
          </label>
          <input id="teacher" name="teacher" defaultValue={initial?.teacher ?? "José Maria Garcia"} className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Descrição
        </label>
        <textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} className={AREA} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className="mb-1 block text-sm font-medium">
            Data
          </label>
          <input id="date" name="date" type="date" defaultValue={start.date} className={INPUT} />
        </div>
        <div>
          <label htmlFor="time" className="mb-1 block text-sm font-medium">
            Hora
          </label>
          <input id="time" name="time" type="time" defaultValue={start.time} className={INPUT} />
        </div>
        <div>
          <label htmlFor="timezone" className="mb-1 block text-sm font-medium">
            Fuso horário da aula
          </label>
          <select id="timezone" name="timezone" defaultValue={initial?.timezone ?? "Europe/Lisbon"} className={INPUT}>
            {TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {z.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-ink-soft">
        A hora é a do fuso escolhido, não a do teu computador. Cada membro vê a aula na hora do seu fuso.
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-medium">
            Duração (minutos)
          </label>
          <input id="duration" name="duration" inputMode="numeric" defaultValue={initial?.duration_min ?? 60} className={INPUT} />
        </div>
        <div>
          <label htmlFor="waitingOpens" className="mb-1 block text-sm font-medium">
            Sala de espera abre (min antes)
          </label>
          <input id="waitingOpens" name="waitingOpens" inputMode="numeric" defaultValue={initial?.waiting_opens_min ?? 15} className={INPUT} />
        </div>
        {!initial && (
          <div>
            <label htmlFor="repeat" className="mb-1 block text-sm font-medium">
              Repetir mais (semanas)
            </label>
            <input id="repeat" name="repeat" inputMode="numeric" defaultValue="0" className={INPUT} />
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="level" className="mb-1 block text-sm font-medium">
            Nível
          </label>
          <select id="level" name="level" defaultValue={initial?.level ?? ""} className={INPUT}>
            <option value="">Sem nível</option>
            <option>Todos os níveis</option>
            <option>Iniciante</option>
            <option>Intermédio</option>
            <option>Avançado</option>
          </select>
        </div>
        <div>
          <label htmlFor="materials" className="mb-1 block text-sm font-medium">
            Materiais necessários
          </label>
          <input id="materials" name="materials" defaultValue={initial?.materials ?? ""} placeholder="Tapete, bloco, manta" className={INPUT} />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input name="hasRecording" type="checkbox" defaultChecked={initial?.has_recording ?? true} className="size-4 accent-clay" />
        Esta aula vai ser gravada
      </label>

      {error && <Notice kind="error">{error}</Notice>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-60">
          <SubmitButton pending={pending}>{pending ? "A guardar" : "Guardar"}</SubmitButton>
        </div>
        {initial && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-12 items-center justify-center rounded-full border border-clay-dark px-6 font-medium text-clay-dark transition-colors hover:bg-clay/10"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
