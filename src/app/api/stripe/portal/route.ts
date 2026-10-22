import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Área do cliente do Stripe: atualizar cartão, ver faturas, cancelar e reativar.
export async function POST() {
  const stripe = getStripe();
  const supabase = await getServerClient();
  if (!stripe || !supabase) {
    return NextResponse.json({ error: "Indisponível." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: "Sem subscrição." }, { status: 404 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${SITE.url}/conta`,
  });
  return NextResponse.json({ url: portal.url });
}
