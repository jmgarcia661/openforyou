"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateAuthError } from "@/lib/auth";
import { getBrowserClient } from "@/lib/supabase/browser";
import { loginSchema } from "@/lib/validation";
import { FormField } from "./FormField";
import { Notice } from "./Notice";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(linkError ? "O link expirou ou já foi usado. Pede um novo." : "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) {
      setError("O início de sessão ainda não está disponível.");
      return;
    }
    setPending(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    if (authError) {
      setPending(false);
      setError(translateAuthError(authError.message));
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField id="email" label="Email" type="email" autoComplete="email" />
      <FormField id="password" label="Palavra-passe" type="password" autoComplete="current-password" />
      {error && <Notice kind="error">{error}</Notice>}
      <SubmitButton pending={pending}>{pending ? "A entrar" : "Entrar"}</SubmitButton>
      <p className="text-sm">
        <Link href="/recuperar-password" className="underline underline-offset-4">
          Esqueci-me da palavra-passe
        </Link>
      </p>
    </form>
  );
}
