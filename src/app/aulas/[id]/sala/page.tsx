import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WaitingRoom } from "@/components/live/WaitingRoom";
import { MembersOnly } from "@/components/MembersOnly";
import { EVENT_TYPES, LIVE_COLUMNS, type LiveEvent } from "@/lib/live";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sala de espera" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SalaPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/aulas/${id}/sala`);

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

  return (
    <div className="wrap max-w-3xl py-12 md:py-16">
      <Link href={`/aulas/${event.id}`} className="text-sm underline underline-offset-4">
        Sair da sala
      </Link>
      <p className="mt-6 text-ink-soft">{EVENT_TYPES[event.event_type] ?? event.event_type}</p>
      <h1 className="mt-1 text-4xl md:text-5xl">{event.title}</h1>
      <div className="mt-8">
        <WaitingRoom initial={event} userId={user.id} />
      </div>
    </div>
  );
}
