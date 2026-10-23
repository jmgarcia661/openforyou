import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WeeklyForm, type Option, type WeeklyInitial } from "@/components/admin/WeeklyForm";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Editar semana" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarSemanaPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: week } = await supabase
    .from("weekly_free")
    .select("id, starts_on, ends_on, theme, reflection, yoga_id, meditation_id, sound_id")
    .eq("id", id)
    .maybeSingle();
  if (!week) return notFound();

  const { data } = await supabase
    .from("content_items")
    .select("id, kind, title")
    .eq("status", "published")
    .order("title");
  const items = (data ?? []) as { id: string; kind: string; title: string }[];
  const by = (kind: string): Option[] => items.filter((i) => i.kind === kind).map((i) => ({ id: i.id, title: i.title }));

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl md:text-5xl">Editar semana</h1>
      <WeeklyForm initial={week as WeeklyInitial} yoga={by("yoga")} meditation={by("meditation")} sound={by("sound")} />
    </div>
  );
}
