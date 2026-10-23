import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { Countdown } from "@/components/live/Countdown";
import { RsvpButton } from "@/components/live/RsvpButton";
import { MembersOnly } from "@/components/MembersOnly";
import { EVENT_TYPES, effectiveStatus, googleCalendarUrl, LIVE_COLUMNS, LIVE_STATUS_LABEL, type LiveEvent } from "@/lib/live";
import { SITE } from "@/lib/site";
import { formatDateTime } from "@/lib/time";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aula" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AulaPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/aulas/${id}`);

  const { data } = await supabase.from("live_events").select(LIVE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) {
    const [{ data: member }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_active_subscription"),
      supabase.rpc("is_admin"),
    ]);
    if (member || isAdmin) return notFound();
    return <MembersOnly title="Esta aula é para membros" />;
  }
  const event = data as LiveEvent;

  const [{ data: profile }, { data: rsvp }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
    supabase.from("event_rsvps").select("event_id").eq("event_id", id).eq("user_id", user.id).maybeSingle(),
  ]);
  const tz: string = profile?.timezone ?? "Europe/Lisbon";
  const status = effectiveStatus(event);
  const canEnter = status === "waiting" || status === "live";

  return (
    <div className="wrap max-w-3xl py-12 md:py-16">
      <Link href="/calendario" className="text-sm underline underline-offset-4">
        Voltar ao calendário
      </Link>
      <p className="mt-6 text-ink-soft">{EVENT_TYPES[event.event_type] ?? event.event_type}</p>
      <h1 className="mt-1 text-4xl md:text-6xl">{event.title}</h1>
      <p className="mt-3 text-lg capitalize text-ink-soft">
        {formatDateTime(event.starts_at, tz)} · {event.duration_min} min
      </p>

      <p className="mt-6 inline-block rounded-full bg-sand px-4 py-2">
        {LIVE_STATUS_LABEL[status]}
        {status === "scheduled" || status === "waiting" ? (
          <>
            {" · começa em "}
            <Countdown target={event.starts_at} />
          </>
        ) : null}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canEnter && (
          <ButtonLink href={`/aulas/${event.id}/sala`}>
            {status === "live" ? "Entrar na aula" : "Entrar na sala de espera"}
          </ButtonLink>
        )}
        <RsvpButton eventId={event.id} userId={user.id} initial={Boolean(rsvp)} />
      </div>

      {event.description && <p className="mt-10 max-w-2xl text-lg">{event.description}</p>}
      {event.teacher && (
        <p className="mt-4 text-ink-soft">
          <span className="font-medium text-ink">Professor:</span> {event.teacher}
        </p>
      )}
      {event.level && (
        <p className="mt-1 text-ink-soft">
          <span className="font-medium text-ink">Nível:</span> {event.level}
        </p>
      )}
      {event.materials && (
        <p className="mt-1 text-ink-soft">
          <span className="font-medium text-ink">Materiais:</span> {event.materials}
        </p>
      )}
      <p className="mt-1 text-ink-soft">{event.has_recording ? "Esta aula fica gravada." : "Esta aula não vai ser gravada."}</p>

      {event.recording_content_id && (
        <div className="mt-8">
          <ButtonLink href={`/praticar/${event.recording_content_id}`} variant="secondary">
            Ver a gravação
          </ButtonLink>
        </div>
      )}

      <section aria-labelledby="cal-h" className="mt-12 border-t border-ink/15 pt-8">
        <h2 id="cal-h" className="text-2xl">
          Adicionar ao calendário
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={googleCalendarUrl(event, SITE.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-full border border-ink/30 px-5 text-sm font-medium hover:border-ink"
          >
            Google Calendar
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href={`/api/calendario/${event.id}/ics`}
            className="inline-flex h-11 items-center rounded-full border border-ink/30 px-5 text-sm font-medium hover:border-ink"
          >
            Apple Calendar ou Outlook (.ics)
          </a>
        </div>
      </section>
    </div>
  );
}
