"use client";

import { useState } from "react";
import { translateAuthError } from "@/lib/auth";
import { getBrowserClient } from "@/lib/supabase/browser";
import { newPasswordSchema } from "@/lib/validation";
import { FormField } from "./FormField";
import { Notice } from "./Notice";
import { SubmitButton } from "./SubmitButton";

export function NewPasswordForm({ onDoneHref }: { onDoneHref?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone(false);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const parsed = newPasswordSchema.safeParse({ password: form.get("password"), confirm: form.get("confirm") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) {
      setError("A alteração ainda não está disponível.");
      return;
    }
    setPending(true);
    const { error: authError } = await supabase.auth.updateUser({ password: parsed.data.password });
    setPending(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    formEl.reset();
    if (onDoneHref) {
      window.location.assign(onDoneHref);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField
        id="password"
        label="Nova palavra-passe"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 10 caracteres."
      />
      <FormField id="confirm" label="Repetir palavra-passe" type="password" autoComplete="new-password" />
      {error && <Notice kind="error">{error}</Notice>}
      {done && <Notice kind="success">Palavra-passe alterada.</Notice>}
      <SubmitButton pending={pending}>{pending ? "A guardar" : "Guardar palavra-passe"}</SubmitButton>
    </form>
  );
}
