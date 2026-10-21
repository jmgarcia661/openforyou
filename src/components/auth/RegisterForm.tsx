"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateAuthError } from "@/lib/auth";
import { getBrowserClient } from "@/lib/supabase/browser";
import { registerSchema } from "@/lib/validation";
import { FormField } from "./FormField";
import { Notice } from "./Notice";
import { SubmitButton } from "./SubmitButton";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      terms: form.get("terms") === "on",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) {
      setError("O registo ainda não está disponível.");
      return;
    }
    setPending(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name, terms_accepted: true },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/conta`,
      },
    });
    setPending(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    if (data.session) {
      router.push("/conta");
      router.refresh();
      return;
    }
    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <Notice kind="success">
        Enviámos um email para {sentTo}. Abre a mensagem e clica no link para confirmar a conta. Se não
        aparecer, procura na pasta de spam.
      </Notice>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField id="name" label="Nome" autoComplete="name" />
      <FormField id="email" label="Email" type="email" autoComplete="email" />
      <FormField
        id="password"
        label="Palavra-passe"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 10 caracteres."
      />
      <label className="flex items-start gap-3 text-sm">
        <input name="terms" type="checkbox" className="mt-1 size-4 accent-clay" />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="underline underline-offset-4">
            termos
          </Link>
          , a{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            política de privacidade
          </Link>{" "}
          e as{" "}
          <Link href="/regras-da-comunidade" className="underline underline-offset-4">
            regras da comunidade
          </Link>
          .
        </span>
      </label>
      {error && <Notice kind="error">{error}</Notice>}
      <SubmitButton pending={pending}>{pending ? "A criar conta" : "Criar conta"}</SubmitButton>
    </form>
  );
}
