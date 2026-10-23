import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveControl, type RecordingOption, type Secrets } from "@/components/admin/LiveControl";
import { LiveEventForm } from "@/components/admin/LiveEventForm";
import { requireAdmin } from "@/lib/admin";
import { LIVE_COLUMNS, type LiveEvent } from "@/lib/live";

export const metadata: Metadata = { title: "Gerir aula" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function GerirAulaPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from("live_events").select(LIVE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return notFound();
  const event = data as LiveEvent;

  const [{ data: secretRow }, { data: recs }, { count }] = await Promise.all([
    supabase.from("live_secrets").select("join_url, host_url, meeting_id, passcode").eq("event_id", id).maybeSingle(),
    supabase.from("content_items").select("id, title").eq("kind", "yoga").eq("status", "published").order("title"),
    supabase.from("live_access_log").select("id", { count: "exact", head: true }).eq("event_id", id).eq("action", "join"),
  ]);

  const secrets: Secrets = {
    join_url: secretRow?.join_url ?? "",
    host_url: secretRow?.host_url ?? "",
    meeting_id: secretRow?.meeting_id ?? "",
    passcode: secretRow?.passcode ?? "",
  };

  return (
    <div className="max-w-2xl space-y-12">
      <h1 className="text-4xl md:text-5xl">{event.title}</h1>
      <LiveControl event={event} secrets={secrets} recordings={(recs ?? []) as RecordingOption[]} joinCount={count ?? 0} />
      <section aria-labelledby="details-h" className="space-y-6">
        <h2 id="details-h" className="text-3xl">
          Detalhes da aula
        </h2>
        <LiveEventForm initial={event} />
      </section>
    </div>
  );
}
