import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata: Metadata = { title: "Recuperar palavra-passe" };

export default function RecuperarPage() {
  return (
    <AuthShell
      title="Recuperar palavra-passe"
      subtitle="Indica o teu email e enviamos um link para definires uma nova."
      footer={
        <Link href="/entrar" className="text-ink underline underline-offset-4">
          Voltar a entrar
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
