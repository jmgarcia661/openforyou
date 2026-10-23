import type { Metadata } from "next";
import { WeeklyForm, type Option } from "@/components/admin/WeeklyForm";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Nova semana" };
export const dynamic = "force-dynamic";

export default async function NovaSemanaPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("content_items")
    .select("id, kind, title")
    .eq("status", "published")
    .order("title");
  const items = (data ?? []) as { id: string; kind: string; title: string }[];
  const by = (kind: string): Option[] => items.filter((i) => i.kind === kind).map((i) => ({ id: i.id, title: i.title }));

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl md:text-5xl">Nova semana</h1>
      <WeeklyForm yoga={by("yoga")} meditation={by("meditation")} sound={by("sound")} />
    </div>
  );
}
