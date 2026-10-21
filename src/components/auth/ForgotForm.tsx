"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { forgotSchema } from "@/lib/validation";
import { FormField } from "./FormField";
import { Notice } from "./Notice";
import { SubmitButton } from "./SubmitButton";

export function ForgotForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = forgotSchema.safeParse({ email: form.get("email") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) {
      setError("A recuperação ainda não está disponível.");
      return;
    }
    setPending(true);
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/conta/nova-password`,
    });
    setPending(false);
    // Resposta igual exista ou não a conta, para não revelar quem tem conta.
    setDone(true);
  }

  if (done) {
    return (
      <Notice kind="success">
        Se existir uma conta com esse email, vais receber um link para definir uma nova palavra-passe.
      </Notice>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField id="email" label="Email" type="email" autoComplete="email" />
      {error && <Notice kind="error">{error}</Notice>}
      <SubmitButton pending={pending}>{pending ? "A enviar" : "Enviar link"}</SubmitButton>
    </form>
  );
}
