import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// RGPD: eliminação da conta. A conta só é eliminada pelo próprio utilizador autenticado.
export async function POST(request: Request) {
  const supabase = await getServerClient();
  const admin = getAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Indisponível." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (body.confirm !== "ELIMINAR") {
    return NextResponse.json({ error: "Confirmação em falta." }, { status: 400 });
  }

  // Cancelar primeiro a subscrição no Stripe, para nunca cobrar uma conta que já não existe.
  const stripe = getStripe();
  if (stripe) {
    const { data: subs } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id);
    for (const s of subs ?? []) {
      if (["canceled", "incomplete_expired"].includes(s.status)) continue;
      try {
        await stripe.subscriptions.cancel(s.stripe_subscription_id);
      } catch (e) {
        if ((e as { code?: string }).code === "resource_missing") continue;
        console.error("cancel subscription failed", s.stripe_subscription_id);
        return NextResponse.json({ error: "Não foi possível cancelar a subscrição." }, { status: 500 });
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("delete user failed", error.message);
    return NextResponse.json({ error: "Não foi possível eliminar." }, { status: 500 });
  }

  if (user.email) {
    await admin.from("newsletter_subscribers").delete().eq("email", user.email.toLowerCase());
  }
  await admin.from("audit_log").insert({ action: "account_deleted", entity: "user", entity_id: user.id });
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
