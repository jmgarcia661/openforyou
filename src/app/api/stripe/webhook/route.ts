import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillEbookSession, markEbookRefunded } from "@/lib/book";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/subscription";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = getAdminClient();
  if (!stripe || !secret || !admin) {
    return NextResponse.json({ error: "Indisponível." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Sem assinatura." }, { status: 400 });

  // O corpo tem de ser o texto original, sem alterações, para a assinatura validar.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(admin, sub, session.client_reference_id);
        }
        if (session.mode === "payment") {
          // Compra do eBook: o webhook garante que o registo existe mesmo que a pessoa feche a página.
          await fulfillEbookSession(admin, session);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // Vai buscar o estado atual ao Stripe: evita problemas com eventos fora de ordem.
        const current = event.type === "customer.subscription.deleted" ? sub : await stripe.subscriptions.retrieve(sub.id);
        await syncSubscription(admin, current, null);
        break;
      }
      case "invoice.payment_failed":
      case "charge.refunded": {
        // Fica registado para o administrador consultar. O acesso segue o estado da subscrição.
        await admin.from("audit_log").insert({
          action: event.type,
          entity: "stripe_event",
          entity_id: event.id,
        });
        if (event.type === "charge.refunded") {
          await markEbookRefunded(admin, event.data.object as Stripe.Charge);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("stripe webhook failed", event.type, error);
    // 500 faz o Stripe tentar de novo mais tarde.
    return NextResponse.json({ error: "Falha ao processar." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
