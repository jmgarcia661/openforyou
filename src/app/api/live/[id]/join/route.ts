import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Entregar o link do Zoom só a membros ativos (ou administradores), só quando a aula
// está em direto e as entradas estão abertas. O link do anfitrião nunca sai daqui.
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getServerClient();
  const admin = getAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Indisponível." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  const [{ data: member }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_active_subscription"),
    supabase.rpc("is_admin"),
  ]);
  if (!member && !isAdmin) {
    return NextResponse.json({ error: "Esta aula é para membros." }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("live_events")
    .select("id, status, entries_open, late_message")
    .eq("id", id)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  if (event.status !== "live") {
    return NextResponse.json({ error: "A aula ainda não foi aberta." }, { status: 409 });
  }
  if (!event.entries_open) {
    return NextResponse.json(
      { error: event.late_message || "As entradas para esta aula já estão fechadas." },
      { status: 403 },
    );
  }

  const { data: secret } = await admin.from("live_secrets").select("join_url").eq("event_id", id).maybeSingle();
  if (!secret?.join_url) {
    return NextResponse.json({ error: "O link da aula ainda não está disponível." }, { status: 404 });
  }

  await admin.from("live_access_log").insert({ event_id: id, user_id: user.id, action: "join" });
  return NextResponse.json({ url: secret.join_url });
}
