import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { requireAdmin } from "@/lib/admin";
import { formatDatePt } from "@/lib/subscription";

export const metadata: Metadata = { title: "Semana grátis" };
export const dynamic = "force-dynamic";

export default async function SemanaPage() {
  const { supabase } = await requireAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("weekly_free")
    .select("id, starts_on, ends_on, theme, yoga_id, meditation_id, sound_id")
    .order("starts_on", { ascending: false });
  const weeks = data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl md:text-5xl">Semana grátis</h1>
        <ButtonLink href="/admin/semana/nova" size="sm">
          Nova semana
        </ButtonLink>
      </div>
      <p className="max-w-xl text-ink-soft">
        Cada semana tem uma aula, uma meditação e um som gratuitos. Podes preparar semanas futuras com antecedência.
      </p>

      {weeks.length === 0 ? (
        <p className="text-ink-soft">Ainda não há semanas criadas.</p>
      ) : (
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {weeks.map((w) => {
            const isNow = w.starts_on <= today && w.ends_on >= today;
            const isFuture = w.starts_on > today;
            const filled = [w.yoga_id, w.meditation_id, w.sound_id].filter(Boolean).length;
            return (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">
                    {formatDatePt(w.starts_on)} a {formatDatePt(w.ends_on)}
                    {isNow && <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 text-sm text-moss">Agora</span>}
                    {isFuture && <span className="ml-2 rounded-full bg-sky px-2 py-0.5 text-sm">Agendada</span>}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {w.theme ? `${w.theme} · ` : ""}
                    {filled} de 3 conteúdos
                  </p>
                </div>
                <ButtonLink href={`/admin/semana/${w.id}`} variant="secondary" size="sm">
                  Editar
                </ButtonLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
