import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentForm } from "@/components/admin/ContentForm";
import { requireAdmin } from "@/lib/admin";
import { FULL_COLUMNS, type ContentRow } from "@/lib/content";

export const metadata: Metadata = { title: "Editar conteúdo" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarConteudoPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from("content_items").select(FULL_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return notFound();
  const item = data as ContentRow;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl md:text-5xl">Editar</h1>
      <ContentForm initial={item} defaultKind={item.kind} />
    </div>
  );
}
