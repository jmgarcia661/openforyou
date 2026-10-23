import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MembersOnly } from "@/components/MembersOnly";
import { dayKey, formatDayHeading, formatTime } from "@/lib/time";
import { EVENT_TYPES, effectiveStatus, LIVE_COLUMNS, LIVE_STATUS_LABEL, type LiveEvent } from "@/lib/live";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Calendário" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ vista?: string }> };

export default async function CalendarioPage({ searchParams }: Props) {
  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/calendario");

  const [{ data: member }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_active_subscription"),
    supabase.rpc("is_admin"),
  ]);
  if (!member && !isAdmin) return <MembersOnly title="O calendário é para membros" />;

  const { vista } = await searchParams;
  const month = vista === "mes";

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
  const tz: string = profile?.timezone ?? "Europe/Lisbon";

  const from = new Date(Date.now() - 3 * 3600 * 1000);
  const to = new Date(Date.now() + (month ? 30 : 7) * 86400 * 1000);

  const { data } = await supabase
    .from("live_events")
    .select(LIVE_COLUMNS)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });
  const events = (data ?? []) as LiveEvent[];

  const days = new Map<string, LiveEvent[]>();
  for (const e of events) {
    const key = dayKey(e.starts_at, tz);
    days.set(key, [...(days.get(key) ?? []), e]);
  }
  const now = new Date();

  return (
    <div className="wrap max-w-3xl py-12 md:py-16">
      <h1 className="text-5xl md:text-6xl">Calendário</h1>
      <p className="mt-3 text-ink-soft">Horas no teu fuso horário ({tz.replace("_", " ")}). Podes mudá-lo em A minha conta.</p>

      <nav aria-label="Período" className="mt-8 flex gap-2 text-sm">
        <Link href="/calendario" className={`rounded-full px-4 py-2 ${!month ? "bg-ink text-paper" : "bg-sand"}`}>
          Esta semana
        </Link>
        <Link href="/calendario?vista=mes" className={`rounded-full px-4 py-2 ${month ? "bg-ink text-paper" : "bg-sand"}`}>
          Este mês
        </Link>
      </nav>

      {events.length === 0 ? (
        <p className="mt-10 text-lg text-ink-soft">Ainda não há aulas marcadas neste período.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {[...days.entries()].map(([key, list]) => (
            <section key={key} aria-label={formatDayHeading(list[0].starts_at, tz)}>
              <h2 className="text-2xl capitalize">{formatDayHeading(list[0].starts_at, tz)}</h2>
              <ul className="mt-3 divide-y divide-ink/15 border-y border-ink/15">
                {list.map((e) => {
                  const status = effectiveStatus(e, now);
                  return (
                    <li key={e.id}>
                      <Link href={`/aulas/${e.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-sand/50">
                        <div>
                          <p className="font-medium">
                            {formatTime(e.starts_at, tz)} · {e.title}
                          </p>
                          <p className="text-sm text-ink-soft">
                            {EVENT_TYPES[e.event_type] ?? e.event_type} · {e.duration_min} min
                            {e.has_recording ? " · com gravação" : ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${
                            status === "live" ? "bg-clay text-white" : status === "waiting" ? "bg-moss-soft text-moss" : "bg-sand"
                          }`}
                        >
                          {LIVE_STATUS_LABEL[status]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
