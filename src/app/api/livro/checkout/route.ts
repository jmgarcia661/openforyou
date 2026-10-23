import { NextResponse } from "next/server";
import { formatEUR, getPrices } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { getServerClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Compra do eBook. Não precisa de conta: o Stripe pede o email no pagamento.
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Os pagamentos ainda não estão disponíveis." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!checkoutSchema.safeParse(body).success) {
    return NextResponse.json({ error: "Aceita as condições para continuar." }, { status: 400 });
  }

  // O preço vem sempre do painel: o valor mostrado é o valor cobrado.
  const prices = await getPrices();

  // Se a pessoa já tem sessão, pré-preenche o email e liga a compra à conta.
  let email: string | undefined;
  let userId = "";
  const supabase = await getServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      email = user.email ?? undefined;
      userId = user.id;
    }
  }

  const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: prices.ebookCents,
          product_data: {
            name: "Quem Sou Eu? (eBook)",
            description: "Uma viagem ao coração do Yoga e da consciência. Inclui uma meditação exclusiva.",
          },
          ...(automaticTax ? { tax_behavior: "inclusive" as const } : {}),
        },
      },
    ],
    customer_email: email,
    locale: "pt",
    billing_address_collection: "auto",
    automatic_tax: { enabled: automaticTax },
    custom_text: {
      submit: {
        message: `Hoje pagas ${formatEUR(prices.ebookCents)}, uma só vez. Recebes o eBook e a meditação exclusiva logo a seguir, na página da tua compra.`,
      },
    },
    metadata: { product: "ebook", user_id: userId, immediate_access_requested: "true", terms_accepted_at: new Date().toISOString() },
    success_url: `${SITE.url}/livro/obrigado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/livro#comprar`,
  });

  if (!session.url) return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
  return NextResponse.json({ url: session.url });
}
