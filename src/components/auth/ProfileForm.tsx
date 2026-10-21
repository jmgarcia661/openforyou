"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { profileSchema } from "@/lib/validation";
import { FormField } from "./FormField";
import { Notice } from "./Notice";
import { SubmitButton } from "./SubmitButton";

const ZONES = [
  "Europe/Lisbon",
  "Atlantic/Azores",
  "Atlantic/Madeira",
  "Europe/London",
  "Europe/Paris",
  "Europe/Zurich",
  "Europe/Madrid",
  "America/Sao_Paulo",
  "America/New_York",
  "Africa/Luanda",
  "Africa/Maputo",
];

type Props = { userId: string; email: string; name: string; timezone: string };

export function ProfileForm({ userId, email, name, timezone }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const zones = ZONES.includes(timezone) ? ZONES : [timezone, ...ZONES];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const form = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({ name: form.get("name"), timezone: form.get("timezone") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) {
      setError("A gravação ainda não está disponível.");
      return;
    }
    setPending(true);
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.name, timezone: parsed.data.timezone })
      .eq("id", userId);
    setPending(false);
    if (dbError) {
      setError("Não foi possível guardar o perfil. Tenta novamente.");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField id="email" label="Email" type="email" defaultValue={email} readOnly />
      <FormField id="name" label="Nome" autoComplete="name" defaultValue={name} />
      <div>
        <label htmlFor="timezone" className="mb-1 block text-sm font-medium">
          Fuso horário
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={timezone}
          className="h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base"
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replace("_", " ")}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-ink-soft">As horas das aulas em direto aparecem neste fuso.</p>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {saved && <Notice kind="success">Perfil guardado.</Notice>}
      <SubmitButton pending={pending}>{pending ? "A guardar" : "Guardar perfil"}</SubmitButton>
    </form>
  );
}
