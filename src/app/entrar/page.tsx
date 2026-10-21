import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ next?: string; erro?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <AuthShell
      title="Entrar"
      subtitle="Bem-vindo de volta."
      footer={
        <p>
          Ainda não tens conta?{" "}
          <Link href="/registo" className="text-ink underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      }
    >
      <LoginForm next={safeNext(sp.next)} linkError={sp.erro === "link"} />
    </AuthShell>
  );
}
