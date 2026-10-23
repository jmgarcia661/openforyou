"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { getBrowserClient } from "@/lib/supabase/browser";
import { weeklySchema } from "@/lib/validation";

const INPUT = "h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base";
const AREA = "w-full rounded-xl border border-ink/25 bg-paper px-4 py-3 text-base";

export type Option = { id: string; title: string };

export type WeeklyInitial = {
  id: string;
  starts_on: string;
  ends_on: string;
  theme: string | null;
  reflection: string | null;
  yoga_id: string | null;
  meditation_id: string | null;
  sound_id: string | null;
};

type Props = {
  initial?: WeeklyInitial;
  yoga: Option[];
  meditation: Option[];
  sound: Option[];
};

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

function Select({ id, label, options, value }: { id: string; label: string; options: Option[]; value: string | null | undefined }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <select id={id} name={id} defaultValue={value ?? ""} className={INPUT}>
        <option value="">Nenhum</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function WeeklyForm({ initial, yoga, meditation, sound }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const parsed = weeklySchema.safeParse({
      startsOn: text(form, "startsOn"),
      endsOn: text(form, "endsOn"),
      theme: text(form, "theme"),
      reflection: text(form, "reflection"),
      yogaId: text(form, "yogaId"),
      meditationId: text(form, "meditationId"),
      soundId: text(form, "soundId"),
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
    const row = {
      starts_on: d.startsOn,
      ends_on: d.endsOn,
      theme: d.theme || null,
      reflection: d.reflection || null,
      yoga_id: d.yogaId || null,
      meditation_id: d.meditationId || null,
      sound_id: d.soundId || null,
    };

    setPending(true);
    const { error: dbError } = initial
      ? await supabase.from("weekly_free").update(row).eq("id", initial.id)
      : await supabase.from("weekly_free").insert(row);
    if (dbError) {
      setPending(false);
      setError(`Não foi possível guardar: ${dbError.message}`);
      return;
    }
    router.push("/admin/semana");
    router.refresh();
  }

  async function onDelete() {
    if (!initial) return;
    if (!window.confirm("Eliminar esta seleção semanal?")) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { error: dbError } = await supabase.from("weekly_free").delete().eq("id", initial.id);
    if (dbError) {
      setError(`Não foi possível eliminar: ${dbError.message}`);
      return;
    }
    router.push("/admin/semana");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="startsOn" className="mb-1 block text-sm font-medium">
            Início
          </label>
          <input id="startsOn" name="startsOn" type="date" defaultValue={initial?.starts_on ?? ""} className={INPUT} />
        </div>
        <div>
          <label htmlFor="endsOn" className="mb-1 block text-sm font-medium">
            Fim
          </label>
          <input id="endsOn" name="endsOn" type="date" defaultValue={initial?.ends_on ?? ""} className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="theme" className="mb-1 block text-sm font-medium">
          Tema da semana
        </label>
        <input id="theme" name="theme" defaultValue={initial?.theme ?? ""} className={INPUT} />
      </div>
      <div>
        <label htmlFor="reflection" className="mb-1 block text-sm font-medium">
          Reflexão
        </label>
        <textarea id="reflection" name="reflection" rows={3} defaultValue={initial?.reflection ?? ""} className={AREA} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Select id="yogaId" label="Aula da semana" options={yoga} value={initial?.yoga_id} />
        <Select id="meditationId" label="Meditação da semana" options={meditation} value={initial?.meditation_id} />
        <Select id="soundId" label="Som da semana" options={sound} value={initial?.sound_id} />
      </div>
      <p className="text-sm text-ink-soft">
        Só aparecem conteúdos com o estado Publicado. Quando o período termina, o conteúdo volta a ser só para membros.
      </p>

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
