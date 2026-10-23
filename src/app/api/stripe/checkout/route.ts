import { NextResponse } from "next/server";
import { formatEUR, getPrices } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { addMonths, formatDatePt } from "@/lib/subscription";
import { getServerClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  const couponId = process.env.STRIPE_FIRST_MONTH_COUPON_ID;
  const supabase = await getServerClient();
  if (!stripe || !priceId || !couponId || !supabase) {
    return NextResponse.json({ error: "Os pagamentos ainda não estão disponíveis." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!checkoutSchema.safeParse(body).success) {
    return NextResponse.json({ error: "Aceita as condições para continuar." }, { status: 400 });
  }

  const { data: alreadyActive } = await supabase.rpc("has_active_subscription");
  if (alreadyActive) {
    return NextResponse.json({ error: "Já tens acesso completo." }, { status: 409 });
  }

  // Quem já teve uma subscrição não volta a ter o desconto do primeiro mês.
  const { data: priorRows } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(10);
  const prior = (priorRows ?? []) as { stripe_customer_id: string; status: string }[];
  const customerId: string | null = prior[0]?.stripe_customer_id ?? null;
  const firstTime = !prior.some((r) => !["incomplete", "incomplete_expired"].includes(r.status));

  // Segurança: o que mostramos ao cliente tem de ser igual ao que o Stripe vai cobrar.
  const [prices, price, coupon] = await Promise.all([
    getPrices(),
    stripe.prices.retrieve(priceId),
    firstTime ? stripe.coupons.retrieve(couponId) : Promise.resolve(null),
  ]);
  const monthly = price.unit_amount;
  const baseOk =
    monthly === prices.monthlyCents && price.currency === "eur" && price.recurring?.interval === "month";
  const couponOk =
    !firstTime ||
    (coupon !== null &&
      coupon.amount_off != null &&
      monthly != null &&
      monthly - coupon.amount_off === prices.firstMonthCents &&
      coupon.duration === "once");
  if (!baseOk || !couponOk) {
    console.error("stripe: preços do Stripe não coincidem com os do site");
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Contacta-nos." }, { status: 500 });
  }

  const next = formatDatePt(addMonths(new Date()));
  const summary =
    `Hoje pagas ${formatEUR(firstTime ? prices.firstMonthCents : prices.monthlyCents)}. ` +
    `Próxima renovação: ${formatEUR(prices.monthlyCents)} em ${next}. ` +
    `Depois, ${formatEUR(prices.monthlyCents)}/mês até cancelares. Podes cancelar a qualquer momento.`;

  const acceptedAt = new Date().toISOString();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(firstTime ? { discounts: [{ coupon: couponId }] } : {}),
    ...(customerId
      ? { customer: customerId, customer_update: { address: "auto" as const } }
      : { customer_email: user.email ?? undefined }),
    client_reference_id: user.id,
    locale: "pt",
    billing_address_collection: "required",
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    custom_text: { submit: { message: summary } },
    metadata: { user_id: user.id, terms_accepted_at: acceptedAt, immediate_access_requested: "true" },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${SITE.url}/bem-vindo?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/subscrever`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
