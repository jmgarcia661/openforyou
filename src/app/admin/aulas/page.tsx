import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { requireAdmin } from "@/lib/admin";
import { EVENT_TYPES, effectiveStatus, LIVE_COLUMNS, LIVE_STATUS_LABEL, type LiveEvent } from "@/lib/live";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Aulas em direto" };
export const dynamic = "force-dynamic";

export default async function AulasAdminPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("live_events")
    .select(LIVE_COLUMNS)
    .order("starts_at", { ascending: false })
    .limit(100);
  const events = (data ?? []) as LiveEvent[];
  const now = new Date();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl md:text-5xl">Aulas em direto</h1>
        <ButtonLink href="/admin/aulas/nova" size="sm">
          Criar aula
        </ButtonLink>
      </div>

      {events.length === 0 ? (
        <p className="text-ink-soft">Ainda não há aulas. Cria a primeira, e podes repeti-la todas as semanas.</p>
      ) : (
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm capitalize text-ink-soft">
                  {formatDateTime(e.starts_at, e.timezone)} · {EVENT_TYPES[e.event_type] ?? e.event_type} ·{" "}
                  {LIVE_STATUS_LABEL[effectiveStatus(e, now)]}
                </p>
              </div>
              <ButtonLink href={`/admin/aulas/${e.id}`} variant="secondary" size="sm">
                Gerir
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
