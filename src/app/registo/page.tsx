import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegistoPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Gratuita. Guarda as práticas da semana e recebe novidades."
      footer={
        <p>
          Já tens conta?{" "}
          <Link href="/entrar" className="text-ink underline underline-offset-4">
            Entrar
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
