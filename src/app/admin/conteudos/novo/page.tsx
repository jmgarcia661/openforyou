import type { Metadata } from "next";
import { ContentForm } from "@/components/admin/ContentForm";
import { isKind, KIND_SINGULAR } from "@/lib/content";

export const metadata: Metadata = { title: "Novo conteúdo" };

type Props = { searchParams: Promise<{ tipo?: string }> };

export default async function NovoConteudoPage({ searchParams }: Props) {
  const { tipo } = await searchParams;
  const kind = isKind(tipo) ? tipo : "yoga";

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl md:text-5xl">Novo: {KIND_SINGULAR[kind].toLowerCase()}</h1>
      <ContentForm defaultKind={kind} />
    </div>
  );
}
