import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { requireAdmin } from "@/lib/admin";
import { formatDatePt } from "@/lib/subscription";

export const metadata: Metadata = { title: "Administração" };
export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sand p-5">
      <p className="font-display text-4xl">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [published, drafts, subs, pending, week] = await Promise.all([
    supabase.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("status", ["draft", "review"]),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("weekly_free")
      .select("id, starts_on, ends_on, theme, yoga_id, meditation_id, sound_id")
      .lte("starts_on", today)
      .gte("ends_on", today)
      .order("starts_on", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const current = week.data;
  const missing = current ? [current.yoga_id, current.meditation_id, current.sound_id].filter((v) => !v).length : 3;

  return (
    <div className="space-y-10">
      <h1 className="text-4xl md:text-5xl">Administração</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Conteúdos publicados" value={published.count ?? 0} />
        <Stat label="Rascunhos e em revisão" value={drafts.count ?? 0} />
        <Stat label="Subscrições ativas" value={subs.count ?? 0} />
        <Stat label="Newsletter por confirmar" value={pending.count ?? 0} />
      </div>

      <section aria-labelledby="week-h">
        <h2 id="week-h" className="text-2xl">
          Semana grátis atual
        </h2>
        {current ? (
          <p className="mt-2 text-ink-soft">
            De {formatDatePt(current.starts_on)} a {formatDatePt(current.ends_on)}
            {current.theme ? `, tema "${current.theme}"` : ""}.
            {missing > 0 && ` Faltam ${missing} dos 3 conteúdos.`}
          </p>
        ) : (
          <p className="mt-2 text-clay-dark">Não há seleção gratuita para hoje. O site mostra conteúdos de demonstração.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/admin/semana" variant="secondary">
            Gerir a semana grátis
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="quick-h">
        <h2 id="quick-h" className="text-2xl">
          Atalhos
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/admin/conteudos/novo?tipo=yoga">Adicionar aula</ButtonLink>
          <ButtonLink href="/admin/conteudos/novo?tipo=meditation">Adicionar meditação</ButtonLink>
          <ButtonLink href="/admin/conteudos/novo?tipo=sound">Adicionar som</ButtonLink>
        </div>
      </section>
    </div>
  );
}
