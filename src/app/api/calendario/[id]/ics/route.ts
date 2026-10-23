import { NextResponse } from "next/server";
import { buildIcs, LIVE_COLUMNS, type LiveEvent } from "@/lib/live";
import { SITE } from "@/lib/site";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Indisponível." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  const { data } = await supabase.from("live_events").select(LIVE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  return new NextResponse(buildIcs(data as LiveEvent, SITE.url), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="open-for-you-aula.ics"',
      "Cache-Control": "no-store",
    },
  });
}
