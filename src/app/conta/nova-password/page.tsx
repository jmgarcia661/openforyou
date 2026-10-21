import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";

export const metadata: Metadata = { title: "Nova palavra-passe" };
export const dynamic = "force-dynamic";

export default function NovaPasswordPage() {
  return (
    <AuthShell title="Nova palavra-passe" subtitle="Escolhe uma palavra-passe que só tu conheças.">
      <NewPasswordForm onDoneHref="/conta" />
    </AuthShell>
  );
}
