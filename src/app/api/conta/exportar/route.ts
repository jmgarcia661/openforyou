import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// RGPD: cópia dos dados do próprio utilizador.
export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Indisponível." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, updated_at")
      .eq("user_id", user.id),
  ]);

  let newsletter: unknown = null;
  const admin = getAdminClient();
  if (admin && user.email) {
    const { data } = await admin
      .from("newsletter_subscribers")
      .select("name, email, status, consent_at, created_at")
      .eq("email", user.email.toLowerCase());
    newsletter = data;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile,
    subscriptions,
    newsletter,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="open-for-you-dados.json"',
      "Cache-Control": "no-store",
    },
  });
}
